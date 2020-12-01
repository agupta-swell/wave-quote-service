import { ApiProperty } from '@nestjs/swagger';

export class GenerateTokenReqDto {
  @ApiProperty()
  qualificationCreditId: string;

  @ApiProperty()
  opportunityId: string;
}
