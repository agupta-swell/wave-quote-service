import { ApiProperty } from '@nestjs/swagger';

export class UpdateOpportunityRebateProgramDto {
  @ApiProperty()
  rebateProgramId: string;
}
