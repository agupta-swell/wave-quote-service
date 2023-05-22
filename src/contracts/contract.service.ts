import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { IncomingMessage } from 'http';
import { sumBy } from 'lodash';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { DOWNLOADABLE_RESOURCE, IDownloadResourcePayload, ILoggedInUser } from 'src/app/securities';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ContactService } from 'src/contacts/contact.service';
import { DocusignCommunicationService } from 'src/docusign-communications/docusign-communication.service';
import { SYSTEM_TYPE } from 'src/docusign-templates-master/constants';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { GenabilityUtilityMapService } from 'src/genability-utility-map/genability-utility-map.service';
import { InstalledProductService } from 'src/installed-products/installed-product.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { GetRelatedInformationDto } from 'src/opportunities/res/get-related-information.dto';
import { REBATE_TYPE } from 'src/quotes/constants';
import { IDetailedQuoteSchema, ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { QuoteService } from 'src/quotes/quote.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemAttributeService } from 'src/system-attributes/system-attribute.service';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { SystemProductionService } from 'src/system-productions/system-production.service';
import { UserService } from 'src/users/user.service';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { roundNumber } from 'src/utils/transformNumber';
import { CustomerPayment } from '../customer-payments/customer-payment.schema';
import { CustomerPaymentService } from '../customer-payments/customer-payment.service';
import {
  CONTRACTING_SYSTEM_STATUS,
  IContractSignerDetails,
  IGenericObject,
  IGenericObjectForGSP,
} from '../docusign-communications/typing';
import { FastifyFile } from '../shared/fastify';
import {
  CONTRACT_ROLE,
  CONTRACT_SECRET_PREFIX,
  CONTRACT_TYPE,
  DEFAULT_PROJECT_COMPLETION_DATE_OFFSET,
  PROCESS_STATUS,
  REQUEST_MODE,
  SIGN_STATUS,
  STATUS,
} from './constants';
import { Contract, CONTRACT } from './contract.schema';
import { SaveChangeOrderReqDto, SaveContractReqDto } from './req';
import { ContractReqDto } from './req/contract-req.dto';
import {
  ContractResDto,
  GetContractTemplatesDto,
  GetCurrentContractDto,
  GetDocusignCommunicationDetailsDto,
  SaveChangeOrderDto,
  SaveContractDto,
  SendContractDto,
} from './res';

@Injectable()
export class ContractService {
  constructor(
    @InjectModel(CONTRACT) private readonly contractModel: Model<Contract>,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    private readonly utilityService: UtilityService,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
    private readonly docusignTemplateMasterService: DocusignTemplateMasterService,
    @Inject(forwardRef(() => DocusignCommunicationService))
    private readonly docusignCommunicationService: DocusignCommunicationService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    private readonly customerPaymentService: CustomerPaymentService,
    private readonly systemDesignService: SystemDesignService,
    private readonly jwtService: JwtService,
    private readonly genabilityUtilityMapService: GenabilityUtilityMapService,
    private readonly systemAttributeService: SystemAttributeService,
    private readonly systemProductionService: SystemProductionService,
    private readonly installedProductService: InstalledProductService,
  ) {}

  async getCurrentContracts(opportunityId: string): Promise<OperationResult<GetCurrentContractDto>> {
    const contractRecords = await this.contractModel.find({ opportunityId }).lean();

    const contracts = contractRecords
      .filter(
        e => e.contractType === CONTRACT_TYPE.PRIMARY_CONTRACT || e.contractType === CONTRACT_TYPE.GRID_SERVICES_PACKET,
      )
      .map(e => ({
        contractData: e,
        changeOrders: contractRecords.filter(
          co =>
            co.primaryContractId === e._id.toString() &&
            (co.contractType === CONTRACT_TYPE.CHANGE_ORDER || co.contractType === CONTRACT_TYPE.NO_COST_CHANGE_ORDER),
        ),
      }));
    return OperationResult.ok(strictPlainToClass(GetCurrentContractDto, { contracts }));
  }

  async getContractTemplates(
    opportunityId: string,
    fundingSourceId?: string,
    financierId?: string,
    financialProductId?: string,
    contractType?: CONTRACT_TYPE,
    systemDesignId?: string,
    quoteId?: string,
  ): Promise<OperationResult<GetContractTemplatesDto>> {
    const opportunityData = await this.opportunityService.getDetailById(opportunityId);

    if (!opportunityData) {
      throw ApplicationException.NullEntityFound('Opportunity data');
    }

    // e.g. "SCE - PRP2+SGIP"
    const utilityNameConcatUtilityProgramName = await this.utilityService.getUtilityName(opportunityData.utilityId);

    const utilityName = utilityNameConcatUtilityProgramName.split('-')[0].trim();

    let quoteDetail;

    if (quoteId) {
      quoteDetail = await this.quoteService.getOneById(quoteId || '');
    }
    const utilityProgramIdTemp = quoteDetail?.utilityProgram?.utilityProgramId || null;

    const rebateProgramIdTemp = quoteDetail?.rebateProgram?._id || null;

    if (contractType === CONTRACT_TYPE.GRID_SERVICES_PACKET) {
      const templateMasterRecords = await this.docusignTemplateMasterService.getDocusignCompositeTemplateMasterForGSA(
        [utilityProgramIdTemp, 'ALL'],
        [rebateProgramIdTemp, 'ALL'],
      );

      return OperationResult.ok(strictPlainToClass(GetContractTemplatesDto, { templates: templateMasterRecords }));
    }

    let applicableSystemTypes: SYSTEM_TYPE[] = [];

    const foundSystemDesign = (systemDesignId && (await this.systemDesignService.getOneById(systemDesignId))) || null;

    if (
      foundSystemDesign?.roofTopDesignData.panelArray?.length &&
      foundSystemDesign?.roofTopDesignData.storage?.length
    ) {
      applicableSystemTypes = [SYSTEM_TYPE.SOLAR_AND_STORAGE];
    } else if (foundSystemDesign?.roofTopDesignData.panelArray?.length) {
      applicableSystemTypes = [SYSTEM_TYPE.SOLAR];
    } else if (foundSystemDesign?.roofTopDesignData.storage?.length) {
      applicableSystemTypes = [SYSTEM_TYPE.STORAGE];
    }

    if (!fundingSourceId) {
      throw ApplicationException.ValidationFailed('fundingSourceId is required');
    }

    if (!financierId) {
      throw ApplicationException.ValidationFailed('financierId is required');
    }

    if (!financialProductId) {
      throw ApplicationException.ValidationFailed('financialProductId is required');
    }

    const utilityId = (await this.docusignTemplateMasterService.getUtilityMaster(utilityName))?._id?.toString() || '';

    const templateMasterRecords = await this.docusignTemplateMasterService.getDocusignCompositeTemplateMaster(
      [fundingSourceId, 'ALL'],
      [financierId, 'ALL', undefined],
      [financialProductId, 'ALL', undefined],
      [utilityId, 'ALL'],
      [utilityProgramIdTemp, 'ALL'],
      [...applicableSystemTypes, SYSTEM_TYPE.ALL],
    );

    return OperationResult.ok(strictPlainToClass(GetContractTemplatesDto, { templates: templateMasterRecords }));
  }

  async saveContract(req: SaveContractReqDto): Promise<OperationResult<SaveContractDto>> {
    const { mode, contractDetail } = req;

    if (mode === REQUEST_MODE.ADD && contractDetail.id) {
      throw new BadRequestException({ message: 'Add request cannot have an id value' });
    }

    if (mode === REQUEST_MODE.UPDATE && !contractDetail.id) {
      throw new BadRequestException({ message: 'Update request should have an id value' });
    }

    if (mode === REQUEST_MODE.UPDATE) {
      const contract = await this.contractModel.findById(contractDetail.id).lean();

      if (!contract) {
        throw new BadRequestException({ message: `No matching record to update for id ${contractDetail.id}` });
      }

      if (contract.contractStatus !== PROCESS_STATUS.INITIATED) {
        throw new BadRequestException({ message: 'Contract is already in progress or completed' });
      }

      const newlyUpdatedContract = await this.contractModel
        .findByIdAndUpdate(
          contractDetail.id,
          {
            name: contractDetail.name || contract.name,
          },
          { new: true },
        )
        .lean();

      return OperationResult.ok(strictPlainToClass(SaveContractDto, { status: true, newlyUpdatedContract }));
    }

    if (mode === REQUEST_MODE.ADD) {
      const quoteDetail = await this.quoteService.getOneById(contractDetail.associatedQuoteId);

      if (!quoteDetail) {
        throw new NotFoundException(`No quote found with id ${contractDetail.associatedQuoteId}`);
      }

      if (contractDetail.contractType === CONTRACT_TYPE.GRID_SERVICES_PACKET) {
        const isValid = await this.validateNewGridServiceContract(contractDetail);
        if (!isValid) {
          throw new BadRequestException({ message: 'Not qualified for new GS Contract' });
        }

        const SGIPIncentive = quoteDetail?.quoteFinanceProduct.incentiveDetails.find(
          incentive => incentive.type === REBATE_TYPE.SGIP,
        );

        if (!SGIPIncentive) {
          throw new BadRequestException({ message: 'Swell GridRewards Incentive not found!' });
        }

        await this.opportunityService.updateExistingOppDataById(contractDetail.opportunityId, {
          $set: {
            gsTermYears: SGIPIncentive?.detail.gsTermYears,
          },
        });
      }

      const contractTemplateDetail = await this.docusignTemplateMasterService.getCompositeTemplateById(
        contractDetail.contractTemplateId,
      );

      const { changeOrderDescription: _, ...details } = contractDetail;

      const newlyUpdatedContract = new this.contractModel({
        ...details,
        contractTemplateDetail,
        contractingSystem: 'DOCUSIGN',
        contractStatus: PROCESS_STATUS.INITIATED,
      });

      await newlyUpdatedContract.save();

      const customerPayment = await this.customerPaymentService.create(
        newlyUpdatedContract._id,
        contractDetail.opportunityId,
        quoteDetail,
      );

      if (contractDetail.contractType === CONTRACT_TYPE.PRIMARY_CONTRACT) {
        await this.syncWithWav(newlyUpdatedContract, customerPayment);
      }

      await this.opportunityService.updateExistingOppDataById(contractDetail.opportunityId, {
        $set: {
          utilityProgramId: quoteDetail.utilityProgram?.utilityProgramId,
          rebateProgramId: quoteDetail.rebateProgram?._id,
          electronicPaymentSettings: {
            deposit: quoteDetail.quoteFinanceProduct.financeProduct.productAttribute.upfrontPayment, // enter amount from quote
            depositPayPercent: false, // should be false
            payment1: quoteDetail.quoteFinanceProduct.financeProduct.financialProductSnapshot.payment1, // enter amount from financial product settings
            payment1PayPercent:
              quoteDetail.quoteFinanceProduct.financeProduct.financialProductSnapshot.payment1PayPercent, // based on financial product settings
            payment2: 0, // doesn't matter/0
            payment2PayPercent: false, // doesn't matter/false
            payment2PayBalance: true, // always true
          },
        },
      });

      return OperationResult.ok(strictPlainToClass(SaveContractDto, { status: true, newlyUpdatedContract }));
    }

    return OperationResult.ok(
      strictPlainToClass(SaveContractDto, { status: false, statusDescription: 'Unexpected Operation Mode' }),
    );
  }

  async sendContract(contractId: string, isDraft = false): Promise<OperationResult<SendContractDto>> {
    const contract = await this.contractModel.findById(contractId);

    if (!contract) {
      throw ApplicationException.EntityNotFound(`ContractId: ${contractId}`);
    }

    if (contract.contractStatus === PROCESS_STATUS.VOIDED) {
      throw new BadRequestException('This contract has been voided');
    }

    if (contract.contractStatus === PROCESS_STATUS.DRAFT) {
      if (isDraft) throw new BadRequestException('This contract preview has already been generated');

      // send from draft document
      await this.docusignCommunicationService.sendDraftContract(contract.contractingSystemReferenceId);

      contract.signerDetails[0].sentOn = new Date();
      contract.signerDetails[0].signStatus = SIGN_STATUS.SENT;
      contract.contractStatus = PROCESS_STATUS.IN_PROGRESS;

      await contract.save();

      return OperationResult.ok(
        strictPlainToClass(SendContractDto, { status: 'SUCCESS', newlyUpdatedContract: contract.toJSON() }),
      );
    }

    const opportunity = await this.opportunityService.getDetailById(contract.opportunityId);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`OpportunityId: ${contract.opportunityId}`);
    }

    const quote = await this.quoteService.getOneFullQuoteDataById(contract.associatedQuoteId);

    if (!quote) {
      throw ApplicationException.EntityNotFound(`Associated Quote Id: ${contract.associatedQuoteId}`);
    }

    const [contact, recordOwner] = await Promise.all([
      this.contactService.getContactById(opportunity.contactId),
      this.userService.getUserById(opportunity.recordOwner),
    ]);

    let status: string;
    let statusDescription = '';

    const fundingSourceType = quote.detailedQuote.quoteFinanceProduct.financeProduct.productType;

    const [customerPayment, utilityName, systemDesign, utilityUsageDetails] = await Promise.all([
      this.customerPaymentService.getCustomerPaymentByContractId(contract._id.toString()),
      this.utilityService.getUtilityName(opportunity.utilityId),
      this.systemDesignService.getOneById(
        contract.contractType === CONTRACT_TYPE.NO_COST_CHANGE_ORDER ? contract.systemDesignId : quote.systemDesignId,
        true,
      ),
      this.utilityService.getUtilityByOpportunityId(opportunity._id),
    ]);

    const assignedMember = await this.userService.getUserById(opportunity.assignedMember);

    if (!assignedMember?.hisNumber) {
      throw new HttpException(
        `Assigned sales agent ${assignedMember?.profile.firstName} ${assignedMember?.profile.lastName} does not have an HIS Number`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Get gsProgram=
    const gsProgram = quote.detailedQuote.quoteFinanceProduct.incentiveDetails[0]?.detail?.gsProgramSnapshot;

    // Get utilityProgramMaster
    const utilityProgramMaster = quote.detailedQuote.utilityProgram?.utilityProgramId
      ? await this.utilityProgramMasterService.getLeanById(quote.detailedQuote.utilityProgram.utilityProgramId)
      : null;

    const leaseSolverConfig =
      (quote.detailedQuote.quoteFinanceProduct.financeProduct.productAttribute as ILeaseProductAttributes)
        .leaseSolverConfigSnapshot || null;

    // add props systemProductionData to systemDesign and quote.detailedQuote
    if (systemDesign) {
      const systemProduction = await this.systemProductionService.findById(systemDesign.systemProductionId);
      if (quote?.detailedQuote && systemProduction?.data) {
        systemDesign.systemProductionData = systemProduction.data;
        quote.detailedQuote.systemProduction = systemProduction.data;
      }
    }

    const genericObject: IGenericObject = {
      signerDetails: contract.signerDetails,
      opportunity,
      quote: quote.detailedQuote,
      recordOwner: recordOwner || ({} as any),
      contact: contact || ({} as any),
      customerPayment: customerPayment || ({} as any),
      utilityName: utilityName?.split(' - ')[1] || 'none',
      roofTopDesign: systemDesign?.roofTopDesignData || ({} as any),
      isCash: fundingSourceType === 'cash',
      assignedMember,
      gsProgram,
      utilityProgramMaster,
      leaseSolverConfig,
      financialProduct: quote.detailedQuote.quoteFinanceProduct.financeProduct.financialProductSnapshot,
      contract,
      systemDesign: systemDesign!,
      utilityUsageDetails: utilityUsageDetails!,
    };

    if (contract.contractType !== CONTRACT_TYPE.PRIMARY_CONTRACT) {
      const primaryContract = await this.contractModel.findById(contract.primaryContractId).lean();

      if (!primaryContract) throw new NotFoundException('Primary contract not found');

      const primaryContractQuote = await this.quoteService.getOneById(primaryContract?.associatedQuoteId);

      genericObject.primaryContractQuote = primaryContractQuote;

      genericObject.primaryContract = primaryContract;
    }

    const sentOn = new Date();

    const docusignResponse = await this.docusignCommunicationService.sendContractToDocusign(
      contractId,
      contract.contractTemplateDetail.templateDetails,
      contract.signerDetails,
      genericObject,
      contract.contractTemplateDetail.compositeTemplateData.beginPageNumberingTemplateId,
      isDraft,
    );

    if (isDraft) {
      if (docusignResponse.status === 'SUCCESS' && docusignResponse.contractingSystemReferenceId) {
        status = 'SUCCESS';
        contract.contractStatus = PROCESS_STATUS.DRAFT;
        contract.contractingSystemReferenceId = docusignResponse.contractingSystemReferenceId;
      } else {
        status = 'ERROR';
        statusDescription = 'ERROR';
        contract.contractStatus = PROCESS_STATUS.ERROR;
      }

      await contract.save();

      return OperationResult.ok(
        strictPlainToClass(SendContractDto, { status, statusDescription, newlyUpdatedContract: contract.toJSON() }),
      );
    }

    if (docusignResponse.status === 'SUCCESS') {
      status = 'SUCCESS';
      contract.contractStatus = PROCESS_STATUS.IN_PROGRESS;
      contract.signerDetails[0].signStatus = SIGN_STATUS.SENT;
      contract.signerDetails[0].sentOn = sentOn;
      contract.contractingSystemReferenceId = docusignResponse.contractingSystemReferenceId ?? '';
    } else {
      status = 'ERROR';
      statusDescription = 'ERROR';
      contract.contractStatus = PROCESS_STATUS.ERROR;
    }

    await contract.save();

    return OperationResult.ok(
      strictPlainToClass(SendContractDto, { status, statusDescription, newlyUpdatedContract: contract.toJSON() }),
    );
  }

  async saveChangeOrder(
    req: SaveChangeOrderReqDto & { contract: LeanDocument<Contract> },
  ): Promise<OperationResult<SaveChangeOrderDto>> {
    const { mode, contractDetail, contract } = req;

    if (mode === REQUEST_MODE.UPDATE) {
      const newlyUpdatedContract = await this.contractModel
        .findByIdAndUpdate(
          contractDetail.id,
          {
            primaryContractId: contract.primaryContractId,
            contractType: CONTRACT_TYPE.CHANGE_ORDER,
            contractStatus: contract.contractStatus,
            contractingSystem: 'DOCUSIGN',
          },
          { new: true },
        )
        .lean();

      return OperationResult.ok(strictPlainToClass(SaveChangeOrderDto, { status: true, newlyUpdatedContract }));
    }

    if (mode === REQUEST_MODE.ADD) {
      const quoteDetail = await this.quoteService.getOneById(contractDetail.associatedQuoteId);

      if (!quoteDetail) {
        throw new NotFoundException(`No quote found with id ${contractDetail.associatedQuoteId}`);
      }

      const templateDetail = await this.docusignTemplateMasterService.getCompositeTemplateById(
        contractDetail.contractTemplateId,
      );

      const model = new this.contractModel({
        ...contractDetail,
        contractTemplateDetail: templateDetail,
        contractingSystem: 'DOCUSIGN',
        contractStatus: PROCESS_STATUS.INITIATED,
      });

      await model.save();

      await this.customerPaymentService.create(model._id, contractDetail.opportunityId, quoteDetail);

      return OperationResult.ok(strictPlainToClass(SaveChangeOrderDto, { status: true, newlyUpdatedContract: model }));
    }

    return OperationResult.ok(
      strictPlainToClass(SaveChangeOrderDto, { status: false, statusDescription: 'Unexpected Operation Mode' }),
    );
  }

  async updateContractByDocusign(req: IContractSignerDetails): Promise<void> {
    const { contractSystemReferenceId } = req;

    const contract = await this.contractModel
      .findOne({
        contractSystemReferenceId,
      })
      .lean();
    const quote = await this.quoteService.getOneById(contract?.associatedQuoteId || '');
    if (!contract) {
      throw ApplicationException.EntityNotFound(
        `Contract with contractSystemReferenceId: ${req.contractSystemReferenceId}`,
      );
    }

    req.statusesData.forEach(status => {
      const idx = contract.signerDetails.findIndex(signer => signer.email === status.emailId);

      if (idx === -1) return;

      if (status.status === CONTRACTING_SYSTEM_STATUS.SENT) {
        contract.signerDetails[idx].signStatus = SIGN_STATUS.SENT;
        contract.signerDetails[idx].sentOn = new Date(status.date);
      }

      if (status.status === CONTRACTING_SYSTEM_STATUS.SIGNED) {
        contract.signerDetails[idx].signStatus = SIGN_STATUS.SIGNED;
        contract.signerDetails[idx].signedOn = new Date(status.date);
      }

      if (
        contract.signerDetails[idx].role === CONTRACT_ROLE.PRIMARY_OWNER &&
        status.status === CONTRACTING_SYSTEM_STATUS.SIGNED
      ) {
        const dateOffset =
          quote?.quoteFinanceProduct.financialProductSnapshot.projectCompletionDateOffset ||
          DEFAULT_PROJECT_COMPLETION_DATE_OFFSET;
        contract.projectCompletionDate = new Date(status.date);
        contract.projectCompletionDate.setDate(contract.projectCompletionDate.getDate() + dateOffset);
      }
    });

    if (req.overallContractStatus === 'COMPLETED') {
      contract.contractStatus = PROCESS_STATUS.COMPLETED;
    }

    await this.contractModel.findByIdAndUpdate(contract._id, contract);
  }

  async getDocusignCommunicationDetails(
    contractId: string,
  ): Promise<OperationResult<GetDocusignCommunicationDetailsDto>> {
    const docusignCommunicationDetails = await this.docusignCommunicationService.getCommunicationsByContractId(
      contractId,
    );
    return OperationResult.ok(strictPlainToClass(GetDocusignCommunicationDetailsDto, { docusignCommunicationDetails }));
  }

  async getOneByContractId(id: ObjectId): Promise<Contract> {
    const foundContract = await this.contractModel.findOne({
      _id: id,
    });

    if (!foundContract) {
      throw ApplicationException.NullEntityFound('Contract', id.toString());
    }

    return foundContract;
  }

  async downloadDocusignContract(envelopeId: string, showChanges: boolean): Promise<IncomingMessage | undefined> {
    // eslint-disable-next-line consistent-return
    return this.docusignCommunicationService.downloadContract(envelopeId, showChanges);
  }

  async downloadGSPDocusignContract(envelopeId: string, showChanges: boolean): Promise<IncomingMessage | undefined> {
    // eslint-disable-next-line consistent-return
    return this.docusignCommunicationService.downloadGSPContract(envelopeId, showChanges);
  }

  async getContractDownloadData(id: ObjectId, user: ILoggedInUser): Promise<[string, string]> {
    const foundContract = await this.getOneByContractId(id);
    if (foundContract.contractingSystem !== 'DOCUSIGN' || !foundContract.contractingSystemReferenceId)
      throw ApplicationException.InvalidContract();

    const foundOpp = await this.opportunityService.getRelatedInformation(foundContract.opportunityId);

    let fileName: string;
    switch (foundContract.contractType) {
      case CONTRACT_TYPE.CHANGE_ORDER:
        fileName = this.getChangeOrderDownloadName(foundContract, foundOpp);
        break;
      case CONTRACT_TYPE.NO_COST_CHANGE_ORDER:
        fileName = this.getNoCostChangeOrderDownloadName(foundContract, foundOpp);
        break;
      default:
        fileName = this.getPrimaryContractDownloadName(foundContract, foundOpp);
    }

    const token = await this.generateDownloadToken(id, fileName, user);

    return [fileName, token];
  }

  async generateDownloadToken(id: ObjectId, filename: string, currentUser: ILoggedInUser): Promise<string> {
    const payload: IDownloadResourcePayload = {
      ...currentUser,
      userRoles: ['download_resource'],
      contentType: 'application/pdf',
      filename,
      resourceId: id.toString(),
      type: DOWNLOADABLE_RESOURCE.CONTRACT,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: `${CONTRACT_SECRET_PREFIX}_${JwtConfigService.appSecret}`,
      expiresIn: '24h',
    });

    return token;
  }

  async getLatestPrimaryContractByOpportunity(opportunityId: string): Promise<ContractResDto> {
    const contract = await this.contractModel
      .findOne(
        {
          opportunity_id: opportunityId,
          contract_type: CONTRACT_TYPE.PRIMARY_CONTRACT,
        },
        {},
        {
          sort: {
            created_at: -1,
          },
        },
      )
      .lean();

    return strictPlainToClass(ContractResDto, contract);
  }

  async existsByQuoteId(associatedQuoteId: string): Promise<false | { (name: string): string }> {
    const doc = await this.contractModel
      .find({ associatedQuoteId, contractStatus: { $ne: PROCESS_STATUS.VOIDED } }, { _id: 1, name: 1 })
      .limit(1);

    if (doc.length) {
      return name => `${name} is being used in the contract named ${doc[0].name} (id: ${doc[0].id})`;
    }

    return false;
  }

  public async existBySystemDesignId(systemDesignId: string): Promise<false | { (name: string): string }> {
    const foundNcco = await this.contractModel
      .find({ contractType: CONTRACT_TYPE.NO_COST_CHANGE_ORDER, systemDesignId })
      .select('_id');

    if (foundNcco.length) {
      return name => `${name} is being used in these ncco contracts ${foundNcco.map(e => e._id.toString()).join(';')} `;
    }

    return this.quoteService.existBySystemDesignIdAndSubQuery<{
      _id: ObjectId;
      quoteName: string;
    }>(
      systemDesignId,
      quoteId => [
        {
          $lookup: {
            from: this.contractModel.collection.collectionName,
            let: {
              id: quoteId,
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$associated_quote_id', '$$id'],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                },
              },
            ],
            as: 'contracts',
          },
        },
        {
          $match: {
            'contracts.0': {
              $exists: true,
            },
          },
        },
      ],
      doc => `is being used in the quote named ${doc.quoteName} (id: ${doc._id.toString()})`,
    );
  }

  public async resendContract(contractId: ObjectId): Promise<OperationResult<{ success: boolean }>> {
    const foundContract = await this.getOneByContractId(contractId);

    if (foundContract.contractingSystem !== 'DOCUSIGN' || !foundContract.contractingSystemReferenceId) {
      throw new BadRequestException('This contract is not allowed to resend');
    }

    if (foundContract.contractStatus === PROCESS_STATUS.VOIDED) {
      throw new BadRequestException('This contract is not allowed to resend');
    }

    const res = await this.docusignCommunicationService.resendContract(foundContract.contractingSystemReferenceId);

    if (!res.status) {
      console.error(
        'Contract',
        contractId,
        'envelope',
        foundContract.contractingSystemReferenceId,
        'resend error',
        res.message,
      );
    }

    return OperationResult.ok({ success: res.status });
  }

  private getPrimaryContractDownloadName(
    contract: Contract | LeanDocument<Contract>,
    oppData: OperationResult<GetRelatedInformationDto>,
  ): string {
    let fileName: string;

    const { firstName, lastName } = oppData.data!;
    switch (contract.contractStatus) {
      case PROCESS_STATUS.COMPLETED:
        fileName = `${lastName}, ${firstName} - ${contract.name} - Signed.pdf`;
        break;
      default:
        fileName = `${lastName}, ${firstName} - ${contract.name}.pdf`;
    }

    return fileName;
  }

  private getGSPPrimaryContractDownloadName(contract: Contract | LeanDocument<Contract>, fullName: string): string {
    let fileName: string;

    switch (contract.contractStatus) {
      case PROCESS_STATUS.COMPLETED:
        fileName = `${fullName || ''} - ${contract.name} - Signed.pdf`;
        break;
      default:
        fileName = `${fullName || ''} - ${contract.name}.pdf`;
    }

    return fileName;
  }

  private getChangeOrderDownloadName(
    contract: Contract | LeanDocument<Contract>,
    oppData: OperationResult<GetRelatedInformationDto>,
  ): string {
    let fileName: string;

    const { firstName, lastName } = oppData.data!;
    switch (contract.contractStatus) {
      case PROCESS_STATUS.COMPLETED:
        fileName = `${lastName}, ${firstName} - ${contract.name} - Signed.pdf`;
        break;
      default:
        fileName = `${lastName}, ${firstName} - ${contract.name}.pdf`;
    }

    return fileName;
  }

  private getNoCostChangeOrderDownloadName(
    contract: Contract | LeanDocument<Contract>,
    oppData: OperationResult<GetRelatedInformationDto>,
  ): string {
    let fileName: string;

    const { firstName, lastName } = oppData.data!;
    switch (contract.contractStatus) {
      case PROCESS_STATUS.COMPLETED:
        fileName = `${lastName}, ${firstName} - ${contract.name} - No Cost - Signed.pdf`;
        break;
      default:
        fileName = `${lastName}, ${firstName} - ${contract.name} - No Cost.pdf`;
    }

    return fileName;
  }

  public async countContractsByPrimaryContractId(primaryContractId: string): Promise<number> {
    const count = await this.contractModel.countDocuments({
      primaryContractId,
      contractType: { $in: [CONTRACT_TYPE.CHANGE_ORDER, CONTRACT_TYPE.NO_COST_CHANGE_ORDER] },
    });
    return count;
  }

  async validateNewGridServiceContract(contractDetail: ContractReqDto): Promise<boolean> {
    const [relatedOpportunity, primaryContract] = await Promise.all([
      this.opportunityService.getDetailById(contractDetail.opportunityId),
      this.contractModel
        .findOne(
          {
            opportunityId: contractDetail.opportunityId,
            contractType: CONTRACT_TYPE.PRIMARY_CONTRACT,
          },
          {},
          { sort: { createdAt: -1 } },
        )
        .lean(),
    ]);

    if (
      !relatedOpportunity ||
      (!relatedOpportunity.utilityProgramId && !relatedOpportunity.rebateProgramId) ||
      !primaryContract
    ) {
      return false;
    }

    const associatedQuote = await this.quoteService.getOneById(primaryContract.associatedQuoteId);
    if (!associatedQuote || !associatedQuote.quoteCostBuildup?.storageQuoteDetails?.length) {
      return false;
    }

    return true;
  }

  public async sendContractByWetSigned(contract: Contract, detailedQuote: IDetailedQuoteSchema, file: FastifyFile) {
    const now = new Date();
    const financier = contract.signerDetails.find(e => e.role === 'Financier');

    const opportunity = await this.opportunityService.getDetailById(contract.opportunityId);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`OpportunityId: ${contract.opportunityId}`);
    }

    if (!financier) {
      throw new BadRequestException('Financier is missing');
    }

    const carbonCopiesRecipient = contract.signerDetails.filter(e => e.role !== 'Financier');

    const contact = await this.contactService.getContactById(opportunity.contactId);

    const envelope = await this.docusignCommunicationService.sendWetSingedContract(
      financier,
      carbonCopiesRecipient,
      file,
      `${contact?.lastName}, ${contact?.firstName} - ${contract?.name}`,
    );

    if (envelope.status !== 'sent' || !envelope.envelopeId) {
      console.error(envelope);
      throw new BadRequestException('Can not send this contract');
    }

    financier.signStatus = SIGN_STATUS.SENT;
    financier.sentOn = now;

    contract.contractStatus = PROCESS_STATUS.IN_PROGRESS;
    contract.contractingSystemReferenceId = envelope.envelopeId;

    contract.signerDetails.forEach(e => {
      if (e.role === 'Financier') return;

      e.signStatus = SIGN_STATUS.WET_SIGNED;
      e.signedOn = now;
      e.sentOn = now;
    });

    await contract.save();

    return OperationResult.ok(
      strictPlainToClass(SendContractDto, {
        status: 'SUCCESS',
        newlyUpdatedContract: contract.toJSON(),
      }),
    );
  }

  public async voidContract(
    contract: LeanDocument<Contract> | Contract,
    isUpdateInstalledProduct: boolean,
    user?: ILoggedInUser,
  ): Promise<void> {
    try {
      if (contract?.contractingSystemReferenceId) {
        await this.docusignCommunicationService.voidEnvelope(contract.contractingSystemReferenceId);
      }
    } catch (error) {
      console.error(
        'Failed to void contract',
        contract._id.toString(),
        'envelope id',
        contract.contractingSystemReferenceId,
        error,
      );
    }

    const { _id, primaryContractId, contractType, opportunityId } = contract;

    await this.contractModel.updateOne(
      { _id },
      { $set: { contractStatus: PROCESS_STATUS.VOIDED, updatedAt: new Date() } },
    );

    if (isUpdateInstalledProduct && user && contractType === CONTRACT_TYPE.CHANGE_ORDER) {
      const primaryContract = await this.contractModel.findById(primaryContractId).lean();

      if (!primaryContract) {
        throw ApplicationException.EntityNotFound(`ContractId: ${primaryContractId}`);
      }

      const systemDesign = await this.installedProductService.getSystemDesign(primaryContract);

      if (!systemDesign) {
        return;
      }

      await this.installedProductService.updateLatestProductData(
        opportunityId,
        user.userId,
        Object.keys(systemDesign.capacityProductionDesignData ?? {}).length
          ? systemDesign.capacityProductionDesignData
          : systemDesign.roofTopDesignData,
      );
    }
  }

  public async voidGSPContract(contract: Pick<Contract, '_id' | 'contractingSystemReferenceId'>): Promise<void> {
    try {
      if (contract?.contractingSystemReferenceId) {
        await this.docusignCommunicationService.voidGSPEnvelope(contract.contractingSystemReferenceId);
      }
    } catch (error) {
      console.error(
        'Failed to void contract',
        contract._id.toString(),
        'envelope id',
        contract.contractingSystemReferenceId,
        error,
      );
    }

    await this.contractModel.updateOne(
      { _id: contract._id },
      { $set: { contractStatus: PROCESS_STATUS.VOIDED, updatedAt: new Date() } },
    );
  }

  public async getCOContractsByPrimaryContractId(primaryContractId: string): Promise<LeanDocument<Contract>[]> {
    const contracts = await this.contractModel.find({
      primaryContractId,
      contractType: {
        $ne: CONTRACT_TYPE.GRID_SERVICES_PACKET,
      },
    });

    return contracts;
  }

  public async getContractSinceLastModified(
    contractId: ObjectId,
    since: Date,
  ): Promise<OperationResult<ContractResDto> | undefined> {
    const foundContract = await this.getOneByContractId(contractId);

    if (foundContract.updatedAt.getTime() > since.getTime()) {
      return OperationResult.ok(strictPlainToClass(ContractResDto, foundContract.toJSON()));
    }

    return undefined;
  }

  async syncWithWav(contractDetail: Contract, customerPayment: CustomerPayment): Promise<void> {
    const [quoteDetail, utilityData] = await Promise.all([
      this.quoteService.getOneById(contractDetail.associatedQuoteId),
      this.utilityService.getUtilityByOpportunityId(contractDetail.opportunityId),
    ]);

    if (!quoteDetail || !utilityData) {
      throw new BadRequestException({
        message: 'Related Opportunity or Utility or Quote or CustomerPayment is not found!',
      });
    }

    const wavUtilityCode = await this.genabilityUtilityMapService.getWavUtilityCodeByGenabilityLseName(
      utilityData.utilityData.loadServingEntityData.lseName,
    );

    const joinedUtilityProgramAndRebateProgramName =
      [quoteDetail.utilityProgram?.utilityProgramName, quoteDetail.rebateProgram?.name]
        .filter(name => !!name)
        .join('+') || 'None';

    //  Examples:
    // “SCE - None”
    // “SCE - ACES+SGIP”
    const wavUtilityName = `${wavUtilityCode} - ${joinedUtilityProgramAndRebateProgramName}`;
    const DEFAULT_UTILITY_NAME = 'Other - None';

    const utilityId =
      (await this.utilityService.getUtilityDetailByName(wavUtilityName))?._id ||
      (await this.utilityService.getUtilityDetailByName(DEFAULT_UTILITY_NAME))?._id;

    await this.opportunityService.updateExistingOppDataById(contractDetail.opportunityId, {
      $set: {
        fundingSourceId: quoteDetail?.quoteFinanceProduct.financeProduct.fundingSourceId,
        utilityId,
        primaryQuoteType: quoteDetail.primaryQuoteType,
        amount: customerPayment?.amount,
      },
    });

    const pvKw = roundNumber(
      sumBy(
        quoteDetail.quoteCostBuildup.panelQuoteDetails,
        item => item.panelModelDataSnapshot.ratings.watts * item.quantity,
      ) / 1000,
      3,
    );

    const batteryKw = roundNumber(
      sumBy(
        quoteDetail.quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.ratings.kilowatts * item.quantity,
      ),
      3,
    );

    const batteryKwh = roundNumber(
      sumBy(
        quoteDetail.quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.ratings.kilowattHours * item.quantity,
      ),
      3,
    );

    await this.systemAttributeService.updateSystemAttributeByQuery(
      {
        opportunityId: contractDetail.opportunityId,
      },
      {
        $set: {
          opportunityId: contractDetail.opportunityId,
          pvKw,
          batteryKw,
          batteryKwh,
        },
      },
    );
  }

  async getGSPContractDownloadData(id: ObjectId, user: ILoggedInUser, fullName: string): Promise<[string, string]> {
    const foundContract = await this.getOneByContractId(id);
    if (foundContract.contractingSystem !== 'DOCUSIGN' || !foundContract.contractingSystemReferenceId)
      throw ApplicationException.InvalidContract();

    const fileName = this.getGSPPrimaryContractDownloadName(foundContract, fullName);

    const token = await this.generateDownloadToken(id, fileName, user);

    return [fileName, token];
  }

  async saveGSPContract(req: SaveContractReqDto): Promise<OperationResult<SaveContractDto>> {
    const { mode, contractDetail } = req;

    if (mode === REQUEST_MODE.ADD) {
      let contractTemplateDetail;
      if (contractDetail.contractTemplateId) {
        contractTemplateDetail = await this.docusignTemplateMasterService.getCompositeTemplateById(
          contractDetail.contractTemplateId,
        );
      } else {
        contractTemplateDetail = await this.docusignTemplateMasterService.getCustomGSPTemplates(
          contractDetail.customGSPTemplateIds,
          contractDetail.customGSPBeginPageNumberingTemplateId,
        );
      }

      const newlyUpdatedContract = new this.contractModel({
        ...contractDetail,
        contractTemplateDetail,
        contractingSystem: 'DOCUSIGN',
        contractStatus: PROCESS_STATUS.NOT_STARTED,
        status: STATUS.NEW,
      });

      await newlyUpdatedContract.save();

      return OperationResult.ok(strictPlainToClass(SaveContractDto, { status: true, newlyUpdatedContract }));
    }

    return OperationResult.ok(
      strictPlainToClass(SaveContractDto, { status: false, statusDescription: 'Unexpected Operation Mode' }),
    );
  }

  async sendGSPContract(contractId: string, isDraft = false): Promise<OperationResult<SendContractDto>> {
    const contract = await this.contractModel.findById(contractId);

    if (!contract) {
      throw ApplicationException.EntityNotFound(`ContractId: ${contractId}`);
    }

    const contractName = contract.name;

    if (contract.contractStatus === PROCESS_STATUS.VOIDED) {
      throw new BadRequestException('This contract has been voided');
    }

    if (contract.status === STATUS.AGREEMENT_GENERATED) {
      if (isDraft) throw new BadRequestException('This contract preview has already been generated');

      // send from draft document
      await this.docusignCommunicationService.sendGSPDraftContract(contract.contractingSystemReferenceId);

      contract.signerDetails[0].sentOn = new Date();
      contract.signerDetails[0].signStatus = SIGN_STATUS.SENT;
      contract.contractStatus = PROCESS_STATUS.IN_PROGRESS;
      contract.status = STATUS.SENT_TO_PRIMARY_OWNER;

      await contract.save();

      return OperationResult.ok(
        strictPlainToClass(SendContractDto, { status: 'SUCCESS', newlyUpdatedContract: contract.toJSON() }),
      );
    }

    let status: string;
    let statusDescription = '';

    const utilityProgramMaster = contract.utilityProgramId
      ? await this.utilityProgramMasterService.getLeanById(contract.utilityProgramId)
      : null;

    const contact = await this.contactService.getContactById(contract.primaryOwnerContactId);

    const genericObject: IGenericObjectForGSP = {
      signerDetails: contract.signerDetails,
      contract,
      contact: contact || ({} as any),
      utilityProgramMaster,
    };

    const sentOn = new Date();

    const docusignResponse = await this.docusignCommunicationService.sendGSPContractToDocusign(
      contractId,
      contract.contractTemplateDetail.templateDetails,
      contract.signerDetails,
      genericObject,
      contract.contractTemplateDetail.compositeTemplateData.beginPageNumberingTemplateId,
      contractName,
      isDraft,
    );

    if (isDraft) {
      if (docusignResponse.status === 'SUCCESS' && docusignResponse.contractingSystemReferenceId) {
        status = 'SUCCESS';
        contract.contractStatus = PROCESS_STATUS.IN_PROGRESS;
        contract.status = STATUS.AGREEMENT_GENERATED;
        contract.contractingSystemReferenceId = docusignResponse.contractingSystemReferenceId;
      } else {
        status = 'ERROR';
        statusDescription = 'ERROR';
        contract.contractStatus = PROCESS_STATUS.ERROR;
      }

      await contract.save();

      return OperationResult.ok(
        strictPlainToClass(SendContractDto, { status, statusDescription, newlyUpdatedContract: contract.toJSON() }),
      );
    }

    if (docusignResponse.status === 'SUCCESS') {
      status = 'SUCCESS';
      contract.contractStatus = PROCESS_STATUS.IN_PROGRESS;
      contract.status = STATUS.SENT_TO_PRIMARY_OWNER;
      contract.signerDetails[0].signStatus = SIGN_STATUS.SENT;
      contract.signerDetails[0].sentOn = sentOn;
      contract.contractingSystemReferenceId = docusignResponse.contractingSystemReferenceId ?? '';
    } else {
      status = 'ERROR';
      statusDescription = 'ERROR';
      contract.contractStatus = PROCESS_STATUS.ERROR;
    }

    await contract.save();

    return OperationResult.ok(
      strictPlainToClass(SendContractDto, { status, statusDescription, newlyUpdatedContract: contract.toJSON() }),
    );
  }
}
