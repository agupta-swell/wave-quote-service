import { ApiProperty } from '@nestjs/swagger';
import { TEMPLATE_STATUS } from 'src/docusign-templates-master/constants';

export class TemplateMasterDataResDto {
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
