import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SAVE_TEMPLATE_MODE, TEMPLATE_STATUS, DOCUSIGN_CONTRACT_TYPE } from '../constants';

class TemplateDataReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  templateName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  docusignTemplateId: string;

  @ApiProperty({ enum: TEMPLATE_STATUS })
  @IsNotEmpty()
  templateStatus: TEMPLATE_STATUS;

  @ApiProperty({ type: String, isArray: true })
  @IsNotEmpty()
  @IsArray()
  recipientRoles: string[];

  @ApiProperty({ enum: DOCUSIGN_CONTRACT_TYPE })
  @IsNotEmpty()
  contractType: DOCUSIGN_CONTRACT_TYPE;
}

export class SaveTemplateReqDto {
  @ApiProperty({ enum: SAVE_TEMPLATE_MODE })
  @IsNotEmpty()
  mode: SAVE_TEMPLATE_MODE;

  @ApiProperty({ type: TemplateDataReqDto })
  @Type(() => TemplateDataReqDto)
  @ValidateNested()
  @IsNotEmpty()
  templateData: TemplateDataReqDto;
}
