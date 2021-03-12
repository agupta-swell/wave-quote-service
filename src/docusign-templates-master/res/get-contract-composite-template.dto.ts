import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';
import { DocusignCompositeTemplateMaster } from '../schemas';
import { DocusignCompositeTemplateMasterDataResDto, TemplateMasterDataResDto } from './sub-dto';

export interface ICompositeTemplateResDto {
  templateDetails: LeanDocument<DocusignTemplateMaster>[];
  compositeTemplateData: LeanDocument<DocusignCompositeTemplateMaster>;
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

  transformData(props: LeanDocument<ICompositeTemplateResDto>): CompositeTemplateResDto {
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
