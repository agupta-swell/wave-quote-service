import { Type } from 'class-transformer';
import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { TemplateMasterDataResDto } from './sub-dto';

export class GetTemplateMasterDto {
  @ExposeProp({ type: TemplateMasterDataResDto, isArray: true })
  templateMasters: TemplateMasterDataResDto[];
}

export class GetTemplateMasterRes implements ServiceResponse<GetTemplateMasterDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetTemplateMasterDto })
  data: GetTemplateMasterDto;
}
