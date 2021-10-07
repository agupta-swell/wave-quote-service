import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { SAVE_TEMPLATE_MODE } from '../constants';
import { DocusignCompositeTemplateMasterDataReqDto } from './docusign-composite-template-master-req.dto';

export class SaveContractCompositeTemplateReqDto {
  @ApiProperty({ enum: SAVE_TEMPLATE_MODE })
  @IsEnum(SAVE_TEMPLATE_MODE)
  @IsNotEmpty()
  mode: SAVE_TEMPLATE_MODE;

  @ApiProperty({ type: DocusignCompositeTemplateMasterDataReqDto })
  @Type(() => DocusignCompositeTemplateMasterDataReqDto)
  @ValidateNested()
  @IsNotEmpty()
  compositeTemplateData: DocusignCompositeTemplateMasterDataReqDto;
}
