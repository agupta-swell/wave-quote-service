import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';
import { DocusignCompositeTemplateMaster } from '../schemas';
import { DocusignCompositeTemplateMasterDataResDto, TemplateMasterDataResDto } from './sub-dto';

interface ICompositeTemplateResDto {
  templateDetails: DocusignTemplateMaster[];
  compositeTemplateData: DocusignCompositeTemplateMaster;
}

export class CompositeTemplateResDto {
  @ApiProperty({ type: TemplateMasterDataResDto, isArray: true })
  templateDetails: TemplateMasterDataResDto[];

  @ApiProperty({ type: DocusignCompositeTemplateMasterDataResDto })
  compositeTemplateData: DocusignCompositeTemplateMasterDataResDto;
}

export class GetContractCompositeTemplateDto {
  @ApiProperty({ type: CompositeTemplateResDto, isArray: true })
  compositeTemplates: CompositeTemplateResDto[];

  constructor(props?: ICompositeTemplateResDto[]) {
    this.compositeTemplates = (props || []).map(item => this.transformData(item));
  }

  transformData(props: ICompositeTemplateResDto): CompositeTemplateResDto {
    return {
      templateDetails: props.templateDetails.map(item => ({
        ...toCamelCase(item),
        recipientRoles: item.recipient_roles.map(role => toCamelCase(role)),
      })),
      compositeTemplateData: toCamelCase(props.compositeTemplateData),
    };
  }
}

export class GetContractCompositeTemplateRes implements ServiceResponse<GetContractCompositeTemplateDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetContractCompositeTemplateDto })
  data: GetContractCompositeTemplateDto;
}
