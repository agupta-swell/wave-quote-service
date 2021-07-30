import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';
import { DocusignCompositeTemplateMaster } from '../schemas';
import { DocusignCompositeTemplateMasterDataResDto, TemplateMasterDataResDto } from './sub-dto';

export interface ICompositeTemplateResDto {
  templateDetails: LeanDocument<DocusignTemplateMaster>[];
  compositeTemplateData: LeanDocument<DocusignCompositeTemplateMaster>;
}

export class CompositeTemplateResDto {
  @ExposeProp({ type: TemplateMasterDataResDto, isArray: true })
  templateDetails: TemplateMasterDataResDto[];

  @ExposeProp({ type: DocusignCompositeTemplateMasterDataResDto })
  compositeTemplateData: DocusignCompositeTemplateMasterDataResDto;
}

export class GetContractCompositeTemplateDto {
  @ExposeProp({ type: CompositeTemplateResDto, isArray: true })
  compositeTemplates: CompositeTemplateResDto[];
}

export class GetContractCompositeTemplateRes implements ServiceResponse<GetContractCompositeTemplateDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetContractCompositeTemplateDto })
  data: GetContractCompositeTemplateDto;
}
