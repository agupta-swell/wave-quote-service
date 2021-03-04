import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { DocusignCommunicationService } from 'src/docusign-communications/docusign-communication.service';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { QuoteService } from 'src/quotes/quote.service';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { UserService } from 'src/users/user.service';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { toSnakeCase } from 'src/utils/transformProperties';
import { CustomerPaymentService } from '../customer-payments/customer-payment.service';
import { CONTRACTING_SYSTEM_STATUS, IContractSignerDetails } from '../docusign-communications/typing';
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

@Injectable()
export class ContractService {
  constructor(
    @InjectModel(CONTRACT) private readonly contractModel: Model<Contract>,
    private readonly opportunityService: OpportunityService,
    private readonly quoteService: QuoteService,
    private readonly utilityService: UtilityService,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
    private readonly docusignTemplateMasterService: DocusignTemplateMasterService,
    @Inject(forwardRef(() => DocusignCommunicationService))
    private readonly docusignCommunicationService: DocusignCommunicationService,
    private readonly userService: UserService,
    private readonly contactService: ContactService,
    private readonly customerPaymentService: CustomerPaymentService,
    private readonly systemDesignService: SystemDesignService,
  ) {}

  async getCurrentContracts(opportunityId: string): Promise<OperationResult<GetCurrentContractDto>> {
    const primaryContractRecords = await this.contractModel.find({
      opportunity_id: opportunityId,
      contract_type: CONTRACT_TYPE.PRIMARY,
    });

    const data = await Promise.all(
      primaryContractRecords?.map(async contract => {
        const changeOrders = await this.contractModel.find({
          opportunity_id: opportunityId,
          contract_type: CONTRACT_TYPE.CHANGE_ORDER,
          primary_contract_id: contract.id,
        });

        return {
          contractData: contract?.toObject({ versionKey: false }),
          changeOrders: changeOrders?.map(item => item?.toObject({ versionKey: false })) || [],
        };
      }),
    );

    return OperationResult.ok(new GetCurrentContractDto(data));
  }

  async getContractTemplates(
    opportunityId: string,
    fundingSourceId: string,
  ): Promise<OperationResult<GetContractTemplatesDto>> {
    const { utilityId } = (await this.opportunityService.getDetailById(opportunityId)) ?? { utilityId: '' };
    const complexUtilityName = await this.utilityService.getUtilityName(utilityId);
    const [utilityName = '', utilityProgramName = ''] = complexUtilityName.split('-');
    const utility = await this.docusignTemplateMasterService.getUtilityMaster(utilityName?.trim());
    const utilityProgramId = (
      await this.utilityProgramMasterService.getDetailByName(utilityProgramName.trim())
    )?._id?.toString();
    const templateMasterRecords = await this.docusignTemplateMasterService.getDocusignCompositeTemplateMaster(
      [fundingSourceId],
      [utility?._id?.toString() || ''],
      [utilityProgramId || ''],
    );

    return OperationResult.ok(new GetContractTemplatesDto(templateMasterRecords));
  }

  async saveContract(req: SaveContractReqDto): Promise<OperationResult<SaveContractDto>> {
    const { mode, contractDetail } = req;

    if (mode === REQUEST_MODE.ADD && contractDetail.id) {
      return OperationResult.ok(new SaveContractDto(false, 'Add request cannot have an id value'));
    }

    if (mode === REQUEST_MODE.UPDATE && !contractDetail.id) {
      return OperationResult.ok(new SaveContractDto(false, 'Update request should have an id value'));
    }

    if (mode === REQUEST_MODE.UPDATE) {
      const contract = await this.contractModel.findById(contractDetail.id);

      if (!contract) {
        return OperationResult.ok(
          new SaveContractDto(false, `No matching record to update for id ${contractDetail.id}`),
        );
      }

      if (contract.contract_status !== PROCESS_STATUS.INITIATED) {
        return OperationResult.ok(new SaveContractDto(false, 'Contract is already in progress or completed'));
      }

      const updatedContract = await this.contractModel.findByIdAndUpdate(
        contractDetail.id,
        {
          name: contractDetail.name || contract.name,
        },
        { new: true },
      );

      return OperationResult.ok(new SaveContractDto(true, undefined, updatedContract?.toObject({ versionKey: false })));
    }

    if (mode === REQUEST_MODE.ADD) {
      const templateDetail = await this.docusignTemplateMasterService.getCompositeTemplateById(
        contractDetail.contractTemplateId,
      );

      const model = new this.contractModel({
        opportunity_id: contractDetail.opportunityId,
        contract_type: CONTRACT_TYPE.PRIMARY,
        name: contractDetail.name,
        associated_quote_id: contractDetail.associatedQuoteId,
        contract_template_id: contractDetail.contractTemplateId,
        signer_details: contractDetail.signerDetails.map(item => toSnakeCase(item)),
        contract_template_detail: templateDetail,
        contracting_system: 'DOCUSIGN',
        primary_contract_id: contractDetail.primaryContractId,
        contract_status: PROCESS_STATUS.INITIATED,
      });

      await model.save();

      return OperationResult.ok(new SaveContractDto(true, undefined, model.toObject({ versionKey: false })));
    }

    return OperationResult.ok(new SaveContractDto(false, 'Unexpected Operation Mode'));
  }

  async sendContract(contractId: string): Promise<OperationResult<SendContractDto>> {
    const contract = await this.contractModel.findById(contractId);
    if (!contract) {
      throw ApplicationException.EnitityNotFound(`ContractId: ${contractId}`);
    }

    const opportunity = await this.opportunityService.getDetailById(contract.opportunity_id);
    if (!opportunity) {
      throw ApplicationException.EnitityNotFound(`OpportunityId: ${contract.opportunity_id}`);
    }

    const quote = await this.quoteService.getOneById(contract.associated_quote_id);
    if (!quote) {
      throw ApplicationException.EnitityNotFound(`Associated Quote Id: ${contract.associated_quote_id}`);
    }

    const [contact, recordOwner] = await Promise.all([
      this.contactService.getContactById(opportunity.contactId),
      this.userService.getUserById(opportunity.recordOwner),
    ]);

    let status: string;
    let statusDescription = '';

    const fundingSourceType = quote.quote_finance_product.finance_product.product_type;

    const [customerPayment, utilityName, roofTopDesign] = await Promise.all([
      this.customerPaymentService.getCustomerPaymentByOpportunityId(contract.opportunity_id),
      this.utilityService.getUtilityName(opportunity._id),
      this.systemDesignService.getRoofTopDesignById(opportunity._id),
    ]);

    const docusignResponse = await this.docusignCommunicationService.sendContractToDocusign(contract, {
      contract,
      opportunity,
      quote,
      recordOwner: recordOwner || ({} as any),
      contact: contact || ({} as any),
      customerPayment: customerPayment || ({} as any),
      utilityName: utilityName.split(' - ')[1] || 'none',
      roofTopDesign: roofTopDesign || ({} as any),
      isCash: fundingSourceType === 'cash',
    });

    if (docusignResponse.status === 'SUCCESS') {
      status = 'SUCCESS';
      contract.contract_status = PROCESS_STATUS.IN_PROGRESS;
      contract.signer_details[0].sign_status = SIGN_STATUS.SENT;
      contract.contracting_system_reference_id = docusignResponse.contractingSystemReferenceId ?? '';
    } else {
      status = 'ERROR';
      statusDescription = 'ERROR';
      contract.contract_status = PROCESS_STATUS.ERROR;
    }

    const updatedContract = await this.contractModel.findByIdAndUpdate(
      contract.id,
      contract.toObject({ versionKey: false }),
      { new: true },
    );

    return OperationResult.ok(
      new SendContractDto(status, statusDescription, updatedContract?.toObject({ versionKey: true })),
    );
  }

  async saveChangeOrder(req: SaveChangeOrderReqDto): Promise<OperationResult<SaveChangeOrderDto>> {
    const { mode, contractDetail } = req;

    if (mode === REQUEST_MODE.ADD && contractDetail.id) {
      return OperationResult.ok(new SaveChangeOrderDto(false, 'Add request cannot have an id value'));
    }

    if (mode === REQUEST_MODE.UPDATE && !contractDetail.id) {
      return OperationResult.ok(new SaveChangeOrderDto(false, 'Update request should have an id value'));
    }

    if (mode === REQUEST_MODE.UPDATE) {
      const contract = await this.contractModel.findById(contractDetail.id);

      if (!contract) {
        return OperationResult.ok(
          new SaveChangeOrderDto(false, `No matching record to update for id ${contractDetail.id}`),
        );
      }

      if (contract.contract_status !== PROCESS_STATUS.INITIATED) {
        return OperationResult.ok(new SaveChangeOrderDto(false, 'Contract is already in progress or completed'));
      }

      const updatedContract = await this.contractModel.findByIdAndUpdate(
        contractDetail.id,
        {
          primary_contract_id: contract.primary_contract_id,
          contract_type: CONTRACT_TYPE.CHANGE_ORDER,
          contract_status: contract.contract_status,
          contracting_system: 'DOCUSIGN',
        },
        { new: true },
      );

      return OperationResult.ok(new SaveChangeOrderDto(true, undefined, updatedContract?.toObject()));
    }

    if (mode === REQUEST_MODE.ADD) {
      const templateDetail = await this.docusignTemplateMasterService.getCompositeTemplateById(
        contractDetail.contractTemplateId,
      );

      const model = new this.contractModel({
        opportunity_id: contractDetail.opportunityId,
        contract_type: CONTRACT_TYPE.CHANGE_ORDER,
        name: contractDetail.name,
        associated_quote_id: contractDetail.associatedQuoteId,
        contract_template_id: contractDetail.contractTemplateId,
        signer_details: contractDetail.signerDetails.map(item => toSnakeCase(item)),
        contract_template_detail: templateDetail,
        contracting_system: 'DOCUSIGN',
        primary_contract_id: contractDetail.primaryContractId,
        contract_status: PROCESS_STATUS.INITIATED,
      });

      await model.save();

      return OperationResult.ok(new SaveChangeOrderDto(true, undefined, model.toObject({ versionKey: false })));
    }

    return OperationResult.ok(new SaveChangeOrderDto(false, 'Unexpected Operation Mode'));
  }

  async updateContractByDocusign(req: IContractSignerDetails): Promise<void> {
    const contract = await this.contractModel.findOne({
      contracting_system_reference_id: req.contractSystemReferenceId,
    });

    if (!contract) {
      throw ApplicationException.EnitityNotFound(
        `Contract with contractSystemReferenceId: ${req.contractSystemReferenceId}`,
      );
    }

    req.statusesData.map(status => {
      const signerDetails = contract?.signer_details.find(signer => signer.email === status.emailId) || ({} as any);
      if (status.status === CONTRACTING_SYSTEM_STATUS.SENT) {
        signerDetails.sign_status = SIGN_STATUS.SENT;
        signerDetails.sent_on = new Date(status.date);
      }

      if (status.status === CONTRACTING_SYSTEM_STATUS.SIGNED) {
        signerDetails.sign_status = SIGN_STATUS.SIGNED;
        signerDetails.signed_on = new Date(status.date);
      }
    });

    if (req.overallContractStatus === 'COMPLETED') {
      contract.contract_status = PROCESS_STATUS.COMPLETED;
    }

    await this.contractModel.findByIdAndUpdate(contract._id, contract.toObject({ versionKey: false }));
  }

  async getDocusignCommunicationDetails(
    contractId: string,
  ): Promise<OperationResult<GetDocusignCommunicationDetailsDto>> {
    const communications = await this.docusignCommunicationService.getCommunicationsByContractId(contractId);
    return OperationResult.ok(new GetDocusignCommunicationDetailsDto(communications));
  }
}
