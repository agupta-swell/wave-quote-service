import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { CompositeTemplateResDto } from './get-contract-composite-template.dto';

export class SaveContractCompositeTemplateDto {
  @ExposeProp()
  responseStatus: string;

  @ExposeProp({ type: CompositeTemplateResDto, required: false })
  newUpdatedCompositeTemplate: CompositeTemplateResDto | null;
}

export class SaveContractCompositeTemplateRes implements ServiceResponse<SaveContractCompositeTemplateDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SaveContractCompositeTemplateDto })
  data: SaveContractCompositeTemplateDto;
}
