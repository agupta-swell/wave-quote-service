import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { toCamelCase } from '../../utils/transformProperties';
import { ProposalTemplate } from '../proposal-template.schema';

class SectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  componentName: string;
}

export class ProposalTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: SectionDto, isArray: true })
  sections: SectionDto[];

  constructor(props: ProposalTemplate) {
    this.id = props._id;
    this.name = props.name;
    this.sections = props.sections.map(item => toCamelCase(item));
  }
}

class ProposalTemplatePaginationRes implements Pagination<ProposalTemplateDto> {
  @ApiProperty({
    type: ProposalTemplateDto,
    isArray: true,
  })
  data: ProposalTemplateDto[];

  @ApiProperty()
  total: number;
}

export class ProposalTemplateListRes implements ServiceResponse<ProposalTemplatePaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalTemplatePaginationRes })
  data: ProposalTemplatePaginationRes;
}

export class ProposalTemplateRes implements ServiceResponse<ProposalTemplateDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalTemplateDto })
  data: ProposalTemplateDto;
}
