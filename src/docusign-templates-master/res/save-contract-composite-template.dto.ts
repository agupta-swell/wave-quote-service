import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { DocusignTemplateMaster } from '../docusign-template-master.schema';
import { DocusignCompositeTemplateMaster } from '../schemas';
import { CompositeTemplateResDto } from './get-contract-composite-template.dto';

export interface ICompositeTemplateResDto {
  templateDetails: DocusignTemplateMaster[];
  compositeTemplateData: DocusignCompositeTemplateMaster;
}

export class SaveContractCompositeTemplateDto {
  @ApiProperty()
  responseStatus: string;

  @ApiProperty({ type: () => CompositeTemplateResDto })
  newUpdatedCompositeTemplate: CompositeTemplateResDto;

  constructor(responseStatus: string, props?: ICompositeTemplateResDto) {
    this.responseStatus = responseStatus;
    this.newUpdatedCompositeTemplate = props
      ? {
          templateDetails: props?.templateDetails.map(item => ({
            ...toCamelCase(item),
            recipientRoles: item.recipient_roles.map(role => toCamelCase(role)),
          })),
          compositeTemplateData: toCamelCase(props?.compositeTemplateData),
        }
      : null;
  }
}

export class SaveContractCompositeTemplateRes implements ServiceResponse<SaveContractCompositeTemplateDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: () => SaveContractCompositeTemplateDto })
  data: SaveContractCompositeTemplateDto;
}
