import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

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
  soc: number;

  @ApiProperty()
  dob: Date;
}

export class ApplyCreditQualificationReqDto {
  @ApiProperty()
  @IsNotEmpty()
  qualificationCreditId: string;

  @ApiProperty()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  authenticationToken: string;

  @ApiProperty({ type: ApplicantDataDto })
  @IsNotEmpty()
  primaryApplicantData: ApplicantDataDto;

  @ApiPropertyOptional({ type: ApplicantDataDto })
  @IsOptional({ always: true })
  @Type(() => ApplicantDataDto)
  @ValidateNested()
  coApplicantData: ApplicantDataDto;

  @ApiProperty({ type: PersonalInformationDto })
  primaryApplicantSecuredData: PersonalInformationDto;

  @ApiProperty({ type: PersonalInformationDto })
  coApplicantSecuredData: PersonalInformationDto;
}
