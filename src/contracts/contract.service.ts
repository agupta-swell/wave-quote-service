import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { sumBy } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { IncomingMessage } from 'node:http';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { DocusignCommunicationService } from 'src/docusign-communications/docusign-communication.service';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { GsProgramsService } from 'src/gs-programs/gs-programs.service';
import { LeaseSolverConfigService } from 'src/lease-solver-configs/lease-solver-config.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { GetRelatedInformationDto } from 'src/opportunities/res/get-related-information.dto';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { QuoteService } from 'src/quotes/quote.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { UserService } from 'src/users/user.service';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { CustomerPaymentService } from '../customer-payments/customer-payment.service';
import { CONTRACTING_SYSTEM_STATUS, IContractSignerDetails, IGenericObject } from '../docusign-communications/typing';
import { CONTRACT_TYPE, PROCESS_STATUS, REQUEST_MODE, SIGN_STATUS } from './constants';
import { Contract, CONTRACT } from './contract.schema';
import { SaveChangeOrderReqDto, SaveContractReqDto } from './req';
import { ContractReqDto } from './req/contract-req.dto';
import {
  GetContractTemplatesDto,
  GetCurrentContractDto,
  SaveChangeOrderDto,
  SaveContractDto,
  SendContractDto,
} from './res';
import { GetDocusignCommunicationDetailsDto } from './res/get-docusign-communication-details.dto';
import { ContractResDto } from './res/sub-dto';

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
    private readonly gsProgramsService: GsProgramsService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
    private readonly financialProductService: FinancialProductsService,
  ) {}

  async getCurrentContracts(opportunityId: string): Promise<OperationResult<GetCurrentContractDto>> {
    const contractRecords = await this.contractModel.find({ opportunityId }).lean();

    const contracts = contractRecords
      .filter(
        e =>
          e.contractType === CONTRACT_TYPE.PRIMARY_CONTRACT || e.contractType === CONTRACT_TYPE.GRID_SERVICES_AGREEMENT,
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
    contractType?: CONTRACT_TYPE,
  ): Promise<OperationResult<GetContractTemplatesDto>> {
    const opportunityData = await this.opportunityService.getDetailById(opportunityId);

    if (!opportunityData) {
      throw ApplicationException.NullEntityFound('Opportunity data');
    }

    // e.g. "SCE - PRP2+SGIP"
    const utilityNameConcatUtilityProgramName = await this.utilityService.getUtilityName(opportunityData.utilityId);

    const [utilityName = '', utilityProgramName = ''] = utilityNameConcatUtilityProgramName
      .split('-')
      .map(x => x.trim());

    const utilityProgramId =
      (await this.utilityProgramMasterService.getDetailByName(utilityProgramName))?._id?.toString() || null;

    if (contractType === CONTRACT_TYPE.GRID_SERVICES_AGREEMENT) {
      const rebateProgramId = opportunityData.rebateProgramId || (null as any);
      const templateMasterRecords = await this.docusignTemplateMasterService.getDocusignCompositeTemplateMasterForGSA(
        [utilityProgramId, 'ALL'],
        [rebateProgramId, 'ALL'],
      );

      return OperationResult.ok(strictPlainToClass(GetContractTemplatesDto, { templates: templateMasterRecords }));
    }

    if (!fundingSourceId) {
      throw ApplicationException.ValidationFailed('fundingSourceId is required');
    }

    const utilityId = (await this.docusignTemplateMasterService.getUtilityMaster(utilityName))?._id?.toString() || '';

    const templateMasterRecords = await this.docusignTemplateMasterService.getDocusignCompositeTemplateMaster(
      [fundingSourceId],
      [utilityId],
      [utilityProgramId],
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
      if (contractDetail.contractType === CONTRACT_TYPE.GRID_SERVICES_AGREEMENT) {
        const isValid = await this.validateNewGridServiceContract(contractDetail);
        if (!isValid) {
          throw new BadRequestException({ message: 'Not qualified for new GS Contract' });
        }
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

      return OperationResult.ok(strictPlainToClass(SaveContractDto, { status: true, newlyUpdatedContract }));
    }

    return OperationResult.ok(
      strictPlainToClass(SaveContractDto, { status: false, statusDescription: 'Unexpected Operation Mode' }),
    );
  }

  async sendContract(contractId: string): Promise<OperationResult<SendContractDto>> {
    const contract = await this.contractModel.findById(contractId).lean();

    if (!contract) {
      throw ApplicationException.EntityNotFound(`ContractId: ${contractId}`);
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

    const [customerPayment, utilityName, roofTopDesign, systemDesign] = await Promise.all([
      this.customerPaymentService.getCustomerPaymentByOpportunityId(contract.opportunityId),
      this.utilityService.getUtilityName(opportunity.utilityId),
      this.systemDesignService.getRoofTopDesignById(
        contract.contractType === CONTRACT_TYPE.NO_COST_CHANGE_ORDER ? contract.systemDesignId : quote.systemDesignId,
      ),
      this.systemDesignService.getOneById(quote.systemDesignId),
    ]);

    const assignedMember = await this.userService.getUserById(opportunity.assignedMember);

    // Get gsProgram
    const incentiveDetails = quote.detailedQuote.quoteFinanceProduct.incentiveDetails[0];

    const gsProgramSnapshotId = incentiveDetails.detail.gsProgramSnapshot.id;

    const gsProgram = await this.gsProgramsService.getById(gsProgramSnapshotId);

    // Get utilityProgramMaster
    const utilityProgramMaster = gsProgram
      ? await this.utilityProgramMasterService.getLeanById(gsProgram.utilityProgramId)
      : null;

    const leaseSolverConfig =
      (quote.detailedQuote.quoteFinanceProduct.financeProduct.productAttribute as ILeaseProductAttributes)
        .leaseSolverConfigSnapshot || null;

    const financialProduct = await this.financialProductService.getOneByQuoteId(
      <any>new Types.ObjectId(contract.associatedQuoteId),
    );

    const genericObject: IGenericObject = {
      signerDetails: contract.signerDetails,
      opportunity,
      quote: quote.detailedQuote,
      recordOwner: recordOwner || ({} as any),
      contact: contact || ({} as any),
      customerPayment: customerPayment || ({} as any),
      utilityName: utilityName?.split(' - ')[1] || 'none',
      roofTopDesign: roofTopDesign || ({} as any),
      isCash: fundingSourceType === 'cash',
      assignedMember,
      gsProgram,
      utilityProgramMaster,
      leaseSolverConfig,
      financialProduct,
      contract,
    };

    const sentOn = new Date();

    const docusignResponse = await this.docusignCommunicationService.sendContractToDocusign(
      contractId,
      contract.contractTemplateDetail.templateDetails,
      contract.signerDetails,
      genericObject,
    );

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

    const newlyUpdatedContract = await this.contractModel
      .findOneAndUpdate(
        {
          _id: contract._id,
        },
        contract,
        { new: true },
      )
      .lean();

    return OperationResult.ok(strictPlainToClass(SendContractDto, { status, statusDescription, newlyUpdatedContract }));
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

  async downloadDocusignContract(id: string): Promise<IncomingMessage | undefined> {
    // eslint-disable-next-line consistent-return
    return this.docusignCommunicationService.downloadContract(id);
  }

  async getContractDownloadData(id: ObjectId): Promise<[string, IncomingMessage]> {
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

    const contract = await this.downloadDocusignContract(foundContract.contractingSystemReferenceId);

    if (!contract) {
      throw ApplicationException.NotFoundStatus('Contract Envelope', `${id.toString()}`);
    }

    return [fileName, contract];
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
    const doc = await this.contractModel.find({ associatedQuoteId }, { _id: 1, name: 1 }).limit(1);

    if (doc.length) {
      return name => `${name} is being used in the contract named ${doc[0].name} (id: ${doc[0].id})`;
    }

    return false;
  }

  public async existBySystemDesignId(systemDesignId: string): Promise<false | { (name: string): string }> {
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
      throw new BadRequestException('This contract is not allowed to be resent');
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
  async validateNewGridServiceContract(contractDetail: ContractReqDto): Promise<Boolean> {
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
}
