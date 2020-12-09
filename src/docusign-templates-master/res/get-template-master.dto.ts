import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { TEMPLATE_STATUS } from '../constants';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';
import { toCamelCase } from './../../utils/transformProperties';

class TemplateMasterData {
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

  @ApiProperty({ isArray: true, type: String })
  recipientRoles: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  modifiedAt: Date;
}

export class GetTemplateMasterDto {
  @ApiProperty({ type: TemplateMasterData, isArray: true })
  templateMasters: TemplateMasterData[];

  constructor(props: DocusignTemplateMaster[]) {
    this.templateMasters = props?.map(item => toCamelCase(item));
  }
}

export class GetTemplateMasterRes implements ServiceResponse<GetTemplateMasterDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetTemplateMasterDto })
  data: GetTemplateMasterDto;
}
