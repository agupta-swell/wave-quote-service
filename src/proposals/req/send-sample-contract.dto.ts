import { ApiProperty } from '@nestjs/swagger';
import { ITemplateDetailSchema, ISignerDetailDataSchema } from 'src/contracts/contract.schema';
import { Expose, Type } from 'class-transformer';
import { TEMPLATE_STATUS } from 'src/docusign-templates-master/constants';
import { SIGN_STATUS } from 'src/contracts/constants';

export class SignerRoleMasterDto {
  @ApiProperty({ name: 'roleName' })
  @Expose({ name: 'roleName' })
  role_name: string;

  @ApiProperty({ name: 'roleDescription' })
  @Expose({ name: 'roleDescription' })
  role_description: string;

  @ApiProperty({ name: 'createdBy' })
  @Expose({ name: 'createdBy' })
  created_by: string;

  @ApiProperty({ name: 'createdAt' })
  @Expose({ name: 'createdAt' })
  created_at: Date;

  @ApiProperty({ name: 'updatedBy' })
  @Expose({ name: 'updatedBy' })
  updated_by: string;

  @ApiProperty({ name: 'updatedAt' })
  @Expose({ name: 'updatedAt' })
  updated_at: Date;
}
export class TemplateDetailDto implements ITemplateDetailSchema {
  @ApiProperty()
  _id: string;

  @ApiProperty({ name: 'templateName' })
  @Expose({ name: 'templateName' })
  template_name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ name: 'docusignTemplateId' })
  @Expose({ name: 'docusignTemplateId' })
  docusign_template_id: string;

  @ApiProperty({ name: 'templateStatus', enum: TEMPLATE_STATUS })
  @Expose({ name: 'templateStatus' })
  template_status: TEMPLATE_STATUS;

  // TODO remove annotation
  @ApiProperty({ name: 'recipientRoles' })
  @Expose({ name: 'recipientRoles' })
  @Type(() => SignerRoleMasterDto)
  // @ts-ignore
  recipient_roles: SignerRoleMasterDto[];

  @ApiProperty({ name: 'createdBy' })
  @Expose({ name: 'createdBy' })
  created_by: string;

  @ApiProperty({ name: 'createdAt' })
  @Expose({ name: 'createdAt' })
  created_at: Date;

  @ApiProperty({ name: 'updatedBy' })
  @Expose({ name: 'updatedBy' })
  updated_by: string;

  @ApiProperty({ name: 'updatedAt' })
  @Expose({ name: 'updatedAt' })
  updated_at: Date;

  @ApiProperty()
  id: string;
}

export class SignerDetailDto implements ISignerDetailDataSchema {
  @ApiProperty({ name: 'roleId' })
  @Expose({ name: 'roleId' })
  role_id: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ name: 'firstName' })
  @Expose({ name: 'firstName' })
  first_name: string;

  @ApiProperty({ name: 'lastName' })
  @Expose({ name: 'lastName' })
  last_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ name: 'signStatus', enum: SIGN_STATUS })
  @Expose({ name: 'signStatus' })
  sign_status: SIGN_STATUS;

  @ApiProperty({ name: 'sentOn' })
  @Expose({ name: 'sentOn' })
  sent_on: Date;

  @ApiProperty({ name: 'signedOn' })
  @Expose({ name: 'signedOn' })
  signed_on: Date;

  @ApiProperty({ name: 'phoneNumber' })
  @Expose({ name: 'phoneNumber' })
  phone_number: string;
}

export class ProposalSendSampleContractDto {
  @ApiProperty({ name: 'templateDetails' })
  @Expose({ name: 'templateDetails' })
  @Type(() => TemplateDetailDto)
  template_details: TemplateDetailDto[];

  @ApiProperty({ name: 'signerDetails' })
  @Expose({ name: 'signerDetails' })
  @Type(() => SignerDetailDto)
  signer_details: SignerDetailDto[];
}
