import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { CompositeTemplateResDto, ICompositeTemplateResDto } from './get-contract-composite-template.dto';

export class SaveContractCompositeTemplateDto {
  @ApiProperty()
  responseStatus: string;

  @ApiPropertyOptional({ type: () => CompositeTemplateResDto })
  newUpdatedCompositeTemplate: CompositeTemplateResDto | null;

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
