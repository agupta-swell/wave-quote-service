import { ApiProperty } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  systemDesignId: string;

  @ApiProperty()
  fundingSourceId: string;

  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  quoteName: string;
}
