import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { toSnakeCase } from 'src/utils/transformProperties';
import { UtilityService } from './../utilities/utility.service';
import { CONTRACT_TYPE, PROCESS_STATUS, REQUEST_MODE } from './constants';
import { Contract, CONTRACT } from './contract.schema';
import { SaveContractReqDto } from './req';
import { GetContractTemplatesDto, GetCurrentContractDto, SaveContractDto } from './res';

@Injectable()
export class ContractService {
  constructor(
    @InjectModel(CONTRACT) private readonly contractModel: Model<Contract>,
    private readonly opportunityService: OpportunityService,
    private readonly utilityService: UtilityService,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
    private readonly docusignTemplateMasterService: DocusignTemplateMasterService,
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

  async getContractTemplates(opportunityId: string): Promise<OperationResult<GetContractTemplatesDto>> {
    let { fundingSourceId, utilityId } = await this.opportunityService.getDetail(opportunityId);
    const complexUtilityName = await this.utilityService.getUtilityName(utilityId);
    const [utilityName = '', utilityProgramName = ''] = complexUtilityName.split('-');
    utilityId = (await this.docusignTemplateMasterService.getUtilityMaster(utilityName)).utility_name;
    const utilityProgramId = (await this.utilityProgramMasterService.getDetailByName(utilityProgramName))
      .utility_program_name;
    const templateMasterRecords = await this.docusignTemplateMasterService.getDocusignCompositeTemplateMaster(
      [fundingSourceId],
      [utilityId],
      [utilityProgramId],
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

      return OperationResult.ok(new SaveContractDto(true, null, updatedContract));
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
        template_detail: templateDetail,
        contracting_system: 'DOCUSIGN',
        primary_contract_id: contractDetail.primaryContractId,
        contract_status: PROCESS_STATUS.INITIATED,
      });

      await model.save();

      return OperationResult.ok(new SaveContractDto(true, model.toObject({ versionKey: false })));
    }

    return OperationResult.ok(new SaveContractDto(false, 'Unexpected Operation Mode'));
  }
}
