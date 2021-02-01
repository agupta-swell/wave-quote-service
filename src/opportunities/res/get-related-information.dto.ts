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

  constructor(props: GetRelatedInformationDto) {
    this.address = props.address;
    this.city = props.city;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.opportunityId = props.opportunityId;
    this.state = props.state;
    this.utilityProgramId = props.utilityProgramId ?? '';
  }
}

export class GetRelatedInformationRes implements ServiceResponse<GetRelatedInformationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetRelatedInformationDto })
  data: GetRelatedInformationDto;
}
