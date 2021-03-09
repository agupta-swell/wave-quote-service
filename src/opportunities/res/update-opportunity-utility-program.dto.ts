import { ApiProperty } from '@nestjs/swagger';

export class UpdateOpportunityUtilityProgramDto {
  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  opportunityId: string;

  constructor(props: { utilityProgramId: string; opportunityId: string }) {
    this.utilityProgramId = props.utilityProgramId;
    this.opportunityId = props.opportunityId;
  }
}
