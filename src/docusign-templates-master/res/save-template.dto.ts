import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from '../../utils/transformProperties';
import { TEMPLATE_STATUS } from '../constants';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';

class RecepientRole {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roleName: string;

  @ApiProperty()
  roleDescription: string;
}

class TemplateDataResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateName: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  docusignTemplateId: string;

  @ApiProperty({ enum: TEMPLATE_STATUS })
  templateStatus: TEMPLATE_STATUS;

  @ApiProperty({ type: RecepientRole, isArray: true })
  recipientRoles: RecepientRole[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class SaveTemplateDto {
  @ApiProperty()
  responseStatus: string;

  @ApiProperty({ type: () => TemplateDataResDto })
  newUpdatedTemplateMaster: TemplateDataResDto;

  constructor(responseStatus: string, props?: DocusignTemplateMaster) {
    this.responseStatus = responseStatus;
    this.newUpdatedTemplateMaster = props && {
      ...toCamelCase(props),
      recipientRoles: props.recepient_roles.map(item => toCamelCase(item)),
    };
  }
}

export class SaveTemplateRes implements ServiceResponse<SaveTemplateDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: () => SaveTemplateDto })
  data: SaveTemplateDto;
}
