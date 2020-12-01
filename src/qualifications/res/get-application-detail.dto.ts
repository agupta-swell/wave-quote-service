import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from '../../app/common';

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

export class GetApplicationDetailDto {
  @ApiProperty()
  qualificationCreditId: string;

  @ApiProperty()
  responseStatus: boolean;

  @ApiProperty()
  processStatus: boolean;

  @ApiProperty({ type: ApplicantDataDto })
  primaryApplicantData: ApplicantDataDto;

  @ApiProperty({ type: ApplicantDataDto })
  coApplicantData: ApplicantDataDto;

  @ApiProperty()
  newJWTToken: string;

  constructor(props: any) {
    this.qualificationCreditId = props.qualificationCreditId;
    this.responseStatus = props.responseStatus;
    this.processStatus = props.processStatus;
    this.primaryApplicantData = props.primaryApplicantData;
    this.coApplicantData = props.coApplicantData;
    this.newJWTToken = props.newJWTToken;
  }
}

export class GetApplicationDetailRes implements ServiceResponse<GetApplicationDetailDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetApplicationDetailDto })
  data: GetApplicationDetailDto;
}
