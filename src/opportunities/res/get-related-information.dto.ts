import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';

export class GetRelatedInformationDto {
  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  partnerId: string;

  @ApiProperty()
  opportunityName: string;

  constructor(props: GetRelatedInformationDto) {
    this.address = props.address;
    this.city = props.city;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.opportunityId = props.opportunityId;
    this.state = props.state;
    this.utilityProgramId = props.utilityProgramId ?? '';
    this.zipCode = props.zipCode;
    this.partnerId = props.partnerId;
    this.opportunityName = props.opportunityName;
  }
}

export class GetRelatedInformationRes implements ServiceResponse<GetRelatedInformationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetRelatedInformationDto })
  data: GetRelatedInformationDto;
}
