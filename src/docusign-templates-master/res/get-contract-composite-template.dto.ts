import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { DocusignCompositeTemplateMasterDataResDto, TemplateMasterDataResDto } from './sub-dto';

interface ICompositeTemplateResDto {
  templateDetails: any[];
  compositeTemplateData: any;
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
    this.compositeTemplates = props?.map(item => this.transformData(item));
  }

  transformData(props: CompositeTemplateResDto): CompositeTemplateResDto {
    return {
      templateDetails: props.templateDetails.map(item => toCamelCase(item)),
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
