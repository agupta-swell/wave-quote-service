import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { SYSTEM_TYPE } from 'src/docusign-templates-master/constants';

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
  @IsString()
  type: CONTRACT_TYPE;

  @ApiProperty()
  @IsString()
  filenameForDownloads: string;

  @ApiProperty()
  @IsString({ each: true })
  applicableRebatePrograms: string[];

  @ApiProperty()
  @IsString({ each: true })
  applicableFundingSources: string[];

  @ApiProperty()
  applicableUtilityPrograms: string[];

  @ApiProperty()
  applicableUtilities: string[];

  @ApiProperty()
  applicableStates: string[];

  @ApiProperty({ enum: SYSTEM_TYPE, isArray: true })
  @IsString({ each: true })
  applicableSystemTypes: SYSTEM_TYPE[];

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  updatedAt: Date;
}
