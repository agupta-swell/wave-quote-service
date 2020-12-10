import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
