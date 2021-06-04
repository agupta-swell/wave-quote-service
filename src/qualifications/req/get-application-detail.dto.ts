import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsMongoId, IsOptional, IsString } from 'class-validator';

export class GetApplicationDetailReqDto {
  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  qualificationCreditId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsJWT()
  token: string;
}
