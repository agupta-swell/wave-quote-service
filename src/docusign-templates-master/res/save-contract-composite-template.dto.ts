import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { CompositeTemplateResDto } from './get-contract-composite-template.dto';

export interface ITemplateDetailResDto {
  templateDetail: any;
  signerRoleDetails: any;
}

export interface ICompositeTemplateResDto {
  templateDetails: ITemplateDetailResDto[];
  compositeTemplateData: any;
}

export class SaveContractCompositeTemplateDto {
  @ApiProperty()
  responseStatus: string;

  @ApiProperty({ type: () => CompositeTemplateResDto })
  newUpdatedCompositeTemplate: CompositeTemplateResDto;

  constructor(responseStatus: string, props?: ICompositeTemplateResDto) {
    this.responseStatus = responseStatus;
    this.newUpdatedCompositeTemplate = {
      templateDetails: props.templateDetails.map(item => toCamelCase(item)),
      compositeTemplateData: toCamelCase(props.compositeTemplateData),
    };
  }
}

export class SaveContractCompositeTemplateRes implements ServiceResponse<SaveContractCompositeTemplateDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: () => SaveContractCompositeTemplateDto })
  data: SaveContractCompositeTemplateDto;
}
