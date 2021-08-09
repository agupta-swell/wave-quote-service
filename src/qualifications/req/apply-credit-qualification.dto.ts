import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsJWT,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ApplicantDataDto {
  @ApiProperty()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  middleName: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  addressLine2: string;

  @ApiProperty()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsNotEmpty()
  zipcode: number;
}

class PersonalInformationDto {
  @ApiProperty()
  @IsNumber()
  soc: number;

  @ApiProperty()
  @IsDateString()
  dob: Date;
}

export class ApplyCreditQualificationReqDto {
  @ApiProperty()
  @IsMongoId()
  qualificationCreditId: string;

  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsJWT()
  authenticationToken: string;

  @ApiProperty({ type: ApplicantDataDto })
  @IsNotEmpty()
  @Type(() => ApplicantDataDto)
  @ValidateNested()
  primaryApplicantData: ApplicantDataDto;

  @ApiPropertyOptional({ type: ApplicantDataDto })
  @IsOptional({ always: true })
  @Type(() => ApplicantDataDto)
  @ValidateNested()
  coApplicantData: ApplicantDataDto;

  @ApiProperty({ type: PersonalInformationDto })
  @IsNotEmpty()
  @Type(() => PersonalInformationDto)
  @ValidateNested()
  primaryApplicantSecuredData: PersonalInformationDto;

  @ApiProperty({ type: PersonalInformationDto })
  @IsOptional()
  @Type(() => PersonalInformationDto)
  @ValidateNested()
  coApplicantSecuredData: PersonalInformationDto;
}
