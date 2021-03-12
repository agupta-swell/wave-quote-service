import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { Contract } from 'src/contracts/contract.schema';
import {
  DocusignCompositeTemplateMasterDataResDto,
  TemplateMasterDataResDto,
} from 'src/docusign-templates-master/res/sub-dto';
import { PROCESS_STATUS } from 'src/qualifications/constants';
import { toCamelCase } from 'src/utils/transformProperties';
import { SignerDetailResDto } from './signer-detail.dto';

class TemplateDetailResDto {
  @ApiProperty({ type: TemplateMasterDataResDto, isArray: true })
  templateDetails: TemplateMasterDataResDto[];

  @ApiProperty({ type: DocusignCompositeTemplateMasterDataResDto })
  compositeTemplateData: DocusignCompositeTemplateMasterDataResDto;
}

export class ContractResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty({ enum: CONTRACT_TYPE })
  contractType: CONTRACT_TYPE;

  @ApiProperty()
  name: string;

  @ApiProperty()
  associatedQuoteId: string;

  @ApiProperty()
  contractTemplateId: string;

  @ApiProperty({ type: SignerDetailResDto, isArray: true })
  signerDetails: SignerDetailResDto[];

  @ApiProperty({ type: TemplateDetailResDto })
  contractTemplateDetail: TemplateDetailResDto;

  @ApiProperty()
  contractingSystem: string;

  @ApiProperty()
  primaryContractId: string;

  @ApiProperty({ enum: PROCESS_STATUS })
  contractStatus: PROCESS_STATUS;

  @ApiProperty()
  chnageOrderDescription: string;

  @ApiProperty()
  completionDate: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(contract: LeanDocument<Contract>) {
    Object.assign(this, toCamelCase(contract));
    this.signerDetails = contract?.signer_details?.map(item => toCamelCase(item));
    this.contractTemplateDetail = {
      templateDetails: contract?.contract_template_detail?.template_details?.map(template => ({
        ...toCamelCase(template),
        recipientRoles: template.recipient_roles.map(role => toCamelCase(role)),
      })),
      compositeTemplateData: toCamelCase(contract?.contract_template_detail?.composite_template_data),
    };
  }
}
