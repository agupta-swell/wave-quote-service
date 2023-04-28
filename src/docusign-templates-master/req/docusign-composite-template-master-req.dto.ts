import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, ValidateIf } from 'class-validator';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { SYSTEM_TYPE } from 'src/docusign-templates-master/constants';
import { IsStringOrNull } from 'src/shared/validations';

export class DocusignCompositeTemplateMasterDataReqDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsMongoId({ each: true })
  docusignTemplateIds: string[];

  @ApiProperty({ enum: CONTRACT_TYPE })
  @IsEnum(CONTRACT_TYPE)
  type: CONTRACT_TYPE;

  @ApiProperty()
  @IsString()
  @ValidateIf(
    obj =>
      obj?.compositeTemplateData.type === CONTRACT_TYPE.PRIMARY_CONTRACT ||
      obj?.compositeTemplateData.type === CONTRACT_TYPE.GRID_SERVICES_PACKET,
  )
  filenameForDownloads: string;

  @ApiProperty()
  @IsStringOrNull({ each: true })
  applicableRebatePrograms: string[];

  @ApiProperty()
  @IsString({ each: true })
  applicableFundingSources: string[];

  @ApiProperty()
  @IsString({ each: true })
  applicableFinanciers: string[];

  @ApiProperty()
  @IsString({ each: true })
  applicableFinancialProductTypes: string[];

  @ApiProperty()
  @IsStringOrNull({ each: true })
  applicableUtilityPrograms: string[];

  @ApiProperty()
  @IsStringOrNull({ each: true })
  applicableUtilities: string[];

  @ApiProperty()
  @IsStringOrNull({ each: true })
  applicableStates: string[];

  @ApiProperty({ enum: SYSTEM_TYPE, isArray: true })
  @IsEnum(SYSTEM_TYPE, { each: true })
  applicableSystemTypes: SYSTEM_TYPE[];

  @ApiProperty()
  @IsString()
  beginPageNumberingTemplateId: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  updatedAt: Date;
}
