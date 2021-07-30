import { ServiceResponse } from 'src/app/common';
import { DocusignCompositeTemplateMasterDataResDto } from 'src/docusign-templates-master/res/sub-dto';
import { ExposeProp } from 'src/shared/decorators';

export class GetContractTemplatesDto {
  @ExposeProp({ type: DocusignCompositeTemplateMasterDataResDto, isArray: true })
  templates: DocusignCompositeTemplateMasterDataResDto[];
}

export class GetContractTemplatesRes implements ServiceResponse<GetContractTemplatesDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetContractTemplatesDto })
  data: GetContractTemplatesDto;
}
