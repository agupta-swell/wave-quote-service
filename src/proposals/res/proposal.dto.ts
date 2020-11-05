import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { toCamelCase } from '../../utils/transformProperties';
import { Proposal } from '../proposal.schema';

class SectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  componentName: string;
}

export class ProposalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: SectionDto, isArray: true })
  sections: SectionDto[];

  constructor(props: Proposal) {
    this.id = props._id;
    this.name = props.name;
    this.sections = props.sections.map(item => toCamelCase(item));
  }
}

class ProposalPaginationRes implements Pagination<ProposalDto> {
  @ApiProperty({
    type: ProposalDto,
    isArray: true,
  })
  data: ProposalDto[];

  @ApiProperty()
  total: number;
}

export class ProposalListRes implements ServiceResponse<ProposalPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalPaginationRes })
  data: ProposalPaginationRes;
}

export class ProposalRes implements ServiceResponse<ProposalDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalDto })
  data: ProposalDto;
}
