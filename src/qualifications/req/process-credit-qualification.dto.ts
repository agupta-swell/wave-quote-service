import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsJWT,
  IsMongoId,
  IsString,
} from 'class-validator';

export class ProcessCreditQualificationReqDto {
  @ApiProperty()
  @IsMongoId()
  qualificationCreditId: string;

  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsString()
  refnum: string;

  @ApiProperty()
  @IsJWT()
  authenticationToken: string;
}
