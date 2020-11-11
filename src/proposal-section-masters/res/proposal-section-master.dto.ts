import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProposalSectionMaster } from '../proposal-section-masters.schema';

export class ProposalSectionMasterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  applicableFinancialProducts: string[];

  @ApiProperty()
  applicableProducts: string[];

  @ApiProperty()
  componentName: string;

  constructor(props: ProposalSectionMaster) {
    this.id = props._id;
    this.name = props.name;
    this.applicableFinancialProducts = props.applicable_financial_products;
    this.applicableProducts = props.applicable_products;
    this.componentName = props.component_name;
  }
}

class ProposalSectionMasterPaginationRes implements Pagination<ProposalSectionMasterDto> {
  @ApiProperty({
    type: ProposalSectionMasterDto,
    isArray: true,
  })
  data: ProposalSectionMasterDto[];

  @ApiProperty()
  total: number;
}

export class ProposalSectionMasterListRes implements ServiceResponse<ProposalSectionMasterPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalSectionMasterPaginationRes })
  data: ProposalSectionMasterPaginationRes;
}

export class ProposalSectionMasterRes implements ServiceResponse<ProposalSectionMasterDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalSectionMasterDto })
  data: ProposalSectionMasterDto;
}
