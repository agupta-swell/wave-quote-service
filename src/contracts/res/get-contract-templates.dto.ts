import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { DocusignCompositeTemplateMasterDataResDto } from 'src/docusign-templates-master/res/sub-dto';
import { DocusignCompositeTemplateMaster } from 'src/docusign-templates-master/schemas';
import { toCamelCase } from 'src/utils/transformProperties';

export class GetContractTemplatesDto {
  @ApiProperty({ type: DocusignCompositeTemplateMasterDataResDto, isArray: true })
  templates: DocusignCompositeTemplateMasterDataResDto[];

  constructor(props: DocusignCompositeTemplateMaster[]) {
    this.templates = props?.map((template) => toCamelCase(template));
  }
}

export class GetContractTemplatesRes implements ServiceResponse<GetContractTemplatesDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetContractTemplatesDto })
  data: GetContractTemplatesDto;
}
