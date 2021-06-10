import { ApiProperty } from '@nestjs/swagger';

export class UpdateOpportunityDto {
  @ApiProperty()
  address?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  state?: string;

  @ApiProperty()
  utilityProgramId?: string;

  @ApiProperty()
  rebateProgramId?: string;

  @ApiProperty()
  zipCode?: string;

  @ApiProperty()
  partnerId?: string;
}
