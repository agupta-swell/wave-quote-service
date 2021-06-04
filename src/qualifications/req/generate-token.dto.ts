import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class GenerateTokenReqDto {
  @ApiProperty()
  @IsMongoId()
  qualificationCreditId: string;

  @ApiProperty()
  @IsString()
  opportunityId: string;
}
