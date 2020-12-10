import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { SAVE_TEMPLATE_MODE } from '../constants';
import { DocusignCompositeTemplateMasterDataResDto } from '../res/sub-dto';

export class SaveContractCompositeTemplateReqDto {
  @ApiProperty({ enum: SAVE_TEMPLATE_MODE })
  @IsNotEmpty()
  mode: SAVE_TEMPLATE_MODE;

  @ApiProperty({ type: DocusignCompositeTemplateMasterDataResDto })
  @Type(() => DocusignCompositeTemplateMasterDataResDto)
  @ValidateNested()
  @IsNotEmpty()
  compositeTemplateData: DocusignCompositeTemplateMasterDataResDto;
}
