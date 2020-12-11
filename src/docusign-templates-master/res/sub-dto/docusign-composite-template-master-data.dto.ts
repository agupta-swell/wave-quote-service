import { ApiProperty } from '@nestjs/swagger';
import { SYSTEM_TYPE } from 'src/docusign-templates-master/constants';

export class DocusignCompositeTemplateMasterDataResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: String, isArray: true })
  docusignTemplateIds: string[];

  @ApiProperty()
  isApplicableForChangeOrders: boolean;

  @ApiProperty({ type: String, isArray: true })
  applicableFundingSources: string[];

  @ApiProperty({ type: String, isArray: true })
  applicableUtilityPrograms: string[];

  @ApiProperty({ type: String, isArray: true })
  applicableUtilities: string[];

  @ApiProperty({ type: String, isArray: true })
  applicableStates: string[];

  @ApiProperty({ enum: SYSTEM_TYPE, type: String, isArray: true })
  applicableSystemTypes: SYSTEM_TYPE[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
