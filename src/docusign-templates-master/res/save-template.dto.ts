import { ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { TEMPLATE_STATUS, DOCUSIGN_CONTRACT_TYPE } from '../constants';
import { SignerRoleDataResDto } from './sub-dto';

class TemplateDataResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  templateName: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  docusignTemplateId: string;

  @ExposeProp({ enum: TEMPLATE_STATUS })
  templateStatus: TEMPLATE_STATUS;

  @ExposeProp({ type: SignerRoleDataResDto, isArray: true })
  recipientRoles: SignerRoleDataResDto[];

  @ExposeProp({ enum: DOCUSIGN_CONTRACT_TYPE })
  contractType: DOCUSIGN_CONTRACT_TYPE;

  @ExposeProp()
  createdAt: string;

  @ExposeProp()
  updatedAt: string;
}

export class SaveTemplateDto {
  @ExposeProp()
  responseStatus: string;

  @ExposeProp({ type: TemplateDataResDto, required: false })
  newUpdatedTemplateMaster?: TemplateDataResDto | undefined;
}

export class SaveTemplateRes implements ServiceResponse<SaveTemplateDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SaveTemplateDto })
  data: SaveTemplateDto;
}
