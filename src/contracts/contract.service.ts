import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { sumBy } from 'lodash';
import { ObjectId, Model } from 'mongoose';
import { IncomingMessage } from 'node:http';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { DocusignCommunicationService } from 'src/docusign-communications/docusign-communication.service';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { GsProgramsService } from 'src/gs-programs/gs-programs.service';
import { LeaseSolverConfigService } from 'src/lease-solver-configs/lease-solver-config.service';
import { IGetDetail } from 'src/lease-solver-configs/typing';
import { OpportunityService } from 'src/opportunities/opportunity.service';
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
  ) {}

  async getCurrentContracts(opportunityId: string): Promise<OperationResult<GetCurrentContractDto>> {
    const primaryContractRecords = await this.contractModel
      .find({
        opportunityId,
        contractType: CONTRACT_TYPE.PRIMARY,
      })
      .lean();

    const contracts = await Promise.all(
      primaryContractRecords?.map(async contract => {
        const changeOrders = await this.contractModel
          .find({
            opportunityId,
            contractType: CONTRACT_TYPE.CHANGE_ORDER,
            primaryContractId: contract._id,
          })
          .lean();

        return {
          contractData: contract,
          changeOrders,
        };
      }),
    );

    return OperationResult.ok(strictPlainToClass(GetCurrentContractDto, { contracts }));
  }

  async getContractTemplates(
    opportunityId: string,
    fundingSourceId: string,
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

    const utilityId = (await this.docusignTemplateMasterService.getUtilityMaster(utilityName))?._id?.toString() || '';

    const utilityProgramId =
      (await this.utilityProgramMasterService.getDetailByName(utilityProgramName))?._id?.toString() || null;

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
      const contractTemplateDetail = await this.docusignTemplateMasterService.getCompositeTemplateById(
        contractDetail.contractTemplateId,
      );

      const { chnageOrderDescription: _, ...details } = contractDetail;

      const newlyUpdatedContract = new this.contractModel({
        ...details,
        contractTemplateDetail,
        contractType: CONTRACT_TYPE.PRIMARY,
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
      this.systemDesignService.getRoofTopDesignById(quote.systemDesignId),
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

    // Get lease solver config
    const leaseProductAttribute = quote.detailedQuote.quoteFinanceProduct.financeProduct
      .productAttribute as ILeaseProductAttributes;
    // TODO: Tier/StorageManufacturer support
    const query: IGetDetail = {
      tier: 'DTC',
      isSolar: systemDesign!.isSolar,
      utilityProgramName: utilityProgramMaster ? utilityProgramMaster.utilityProgramName : '',
      contractTerm: leaseProductAttribute.leaseTerm,
      storageSize: sumBy(
        quote.detailedQuote.quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.sizekWh,
      ),
      storageManufacturer: 'Tesla',
      rateEscalator: leaseProductAttribute.rateEscalator,
      capacityKW: systemDesign!.systemProductionData.capacityKW,
      productivity: systemDesign!.systemProductionData.productivity,
    };

    const leaseSolverConfig = await this.leaseSolverConfigService.getDetailByConditions(query);

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

  async saveChangeOrder(req: SaveChangeOrderReqDto): Promise<OperationResult<SaveChangeOrderDto>> {
    const { mode, contractDetail } = req;

    if (mode === REQUEST_MODE.ADD && contractDetail.id) {
      return OperationResult.ok(
        strictPlainToClass(SaveChangeOrderDto, {
          status: false,
          statusDescription: 'Add request cannot have an id value',
        }),
      );
    }

    if (mode === REQUEST_MODE.UPDATE && !contractDetail.id) {
      return OperationResult.ok(
        strictPlainToClass(SaveChangeOrderDto, {
          status: false,
          statusDescription: 'Update request should have an id value',
        }),
      );
    }

    if (mode === REQUEST_MODE.UPDATE) {
      const contract = await this.contractModel.findById(contractDetail.id).lean();

      if (!contract) {
        return OperationResult.ok(
          strictPlainToClass(SaveChangeOrderDto, {
            status: false,
            statusDescription: `No matching record to update for id ${contractDetail.id}`,
          }),
        );
      }

      if (contract.contractStatus !== PROCESS_STATUS.INITIATED) {
        return OperationResult.ok(
          strictPlainToClass(SaveChangeOrderDto, {
            status: false,
            statusDescription: 'Contract is already in progress or completed',
          }),
        );
      }

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

      const { chnageOrderDescription: _, ...details } = contractDetail;

      const model = new this.contractModel({
        ...details,
        contractType: CONTRACT_TYPE.CHANGE_ORDER,
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

    const { name } = foundContract.contractTemplateDetail?.compositeTemplateData;
    const { firstName, lastName } = foundOpp.data as any;

    const contract = await this.downloadDocusignContract(foundContract.contractingSystemReferenceId);

    if (!contract) {
      throw ApplicationException.NotFoundStatus('Contract Envelope', `${id.toString()}`);
    }

    const fileName = `${lastName}-${firstName}-${name}.pdf`;

    return [fileName, contract];
  }

  async getLatestPrimaryContractByOpportunity(opportunityId: string): Promise<ContractResDto> {
    const contract = await this.contractModel
      .findOne(
        {
          opportunity_id: opportunityId,
          contract_type: CONTRACT_TYPE.PRIMARY,
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

  async existsByQuoteId(associatedQuoteId: string): Promise<boolean> {
    const doc = await this.contractModel.find({ associatedQuoteId }, { _id: 1 }).limit(1);

    return !!doc.length;
  }
}
