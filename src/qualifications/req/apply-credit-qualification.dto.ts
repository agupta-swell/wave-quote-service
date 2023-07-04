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
}

class ResidenceDataDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  zipcode: string;
}

class PersonalInformationDto {
  @ApiProperty()
  @IsNumber()
  soc: number;

  @ApiProperty()
  @IsDateString()
  dob: Date;

  @ApiProperty()
  @IsString()
  individualIncome: string;

  @ApiProperty()
  @IsString()
  incomeFrequency: string;
}

class AcknowledgementDataDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  agreement_term_1_checked_at: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  credit_check_authorized_at: Date;
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
  applicant: ApplicantDataDto;

  @ApiProperty({ type: PersonalInformationDto })
  @IsNotEmpty()
  @Type(() => PersonalInformationDto)
  @ValidateNested()
  applicantSecuredData: PersonalInformationDto;

  @ApiProperty({ type: ResidenceDataDto })
  @IsNotEmpty()
  @Type(() => ResidenceDataDto)
  @ValidateNested()
  primaryResidence: ResidenceDataDto;

  @ApiProperty({ type: ResidenceDataDto })
  @IsNotEmpty()
  @Type(() => ResidenceDataDto)
  @ValidateNested()
  installationAddress: ResidenceDataDto;

  @ApiProperty({ type: AcknowledgementDataDto })
  @IsNotEmpty()
  @Type(() => AcknowledgementDataDto)
  @ValidateNested()
  acknowledgement: AcknowledgementDataDto;
}
