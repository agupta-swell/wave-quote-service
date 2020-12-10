import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { DocusignCompositeTemplateMasterDataResDto, SignerRoleDataResDto, TemplateMasterDataResDto } from './sub-dto';

interface ITemplateDetailResDto {
  templateDetail: any;
  signerRoleDetails: any;
}

interface ICompositeTemplateResDto {
  templateDetails: ITemplateDetailResDto[];
  compositeTemplateData: any;
}

class TemplateDetailResDto {
  @ApiProperty({ type: TemplateMasterDataResDto })
  templateDetail: TemplateMasterDataResDto;

  @ApiProperty({ type: SignerRoleDataResDto, isArray: true })
  signerRoleDetails: SignerRoleDataResDto[];
}

export class CompositeTemplateResDto {
  @ApiProperty({ type: TemplateDetailResDto, isArray: true })
  templateDetails: TemplateDetailResDto[];

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
