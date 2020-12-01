import { ApiProperty } from '@nestjs/swagger';

class ApplicantDataDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  middleName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  addressLine1: string;

  @ApiProperty()
  addressLine2: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
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
  qualificationCreditId: string;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  authenticationToken: string;

  @ApiProperty({ type: ApplicantDataDto })
  primaryApplicantData: ApplicantDataDto;

  @ApiProperty({ type: ApplicantDataDto })
  coApplicantData: ApplicantDataDto;

  @ApiProperty({ type: PersonalInformationDto })
  primaryApplicantSecuredData: PersonalInformationDto;

  @ApiProperty({ type: PersonalInformationDto })
  coApplicantSecuredData: PersonalInformationDto;
}
