import { ApiProperty } from '@nestjs/swagger';

export class UpdateOpportunityRebateProgramDto {
  @ApiProperty()
  rebateProgramId: string;

  @ApiProperty()
  opportunityId: string;

  constructor(props: { rebateProgramId: string; opportunityId: string }) {
    this.rebateProgramId = props.rebateProgramId;
    this.opportunityId = props.opportunityId;
  }
}
