import { ApiProperty } from '@nestjs/swagger';

export class UpdateOpportunityUtilityProgramDto {
  @ApiProperty()
  utilityProgramId: string;
}
