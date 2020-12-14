import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { UtilityService } from './../utilities/utility.service';
import { CONTRACT_TYPE } from './constants';
import { Contract, CONTRACT } from './contract.schema';
import { GetContractTemplatesDto, GetCurrentContractDto } from './res';

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
}
