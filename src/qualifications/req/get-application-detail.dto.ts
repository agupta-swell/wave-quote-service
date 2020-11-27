import { ApiProperty } from '@nestjs/swagger';

export class GetApplicationDetailReqDto {
  @ApiProperty()
  qualificationCreditId: string;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  token: string;
}
