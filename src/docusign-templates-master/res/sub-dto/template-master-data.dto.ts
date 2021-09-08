import { TEMPLATE_STATUS } from 'src/docusign-templates-master/constants';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { SignerRoleDataResDto } from './signer-role-data.dto';

export class TemplateMasterDataResDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  templateName: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  docusignTemplateId: string;

  @ExposeProp({ enum: TEMPLATE_STATUS })
  templateStatus: TEMPLATE_STATUS;

  @ExposeProp({ isArray: true, type: SignerRoleDataResDto })
  recipientRoles: SignerRoleDataResDto[];

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  modifiedAt: Date;

  @ExposeProp()
  compositeTemplateId: string;
}
