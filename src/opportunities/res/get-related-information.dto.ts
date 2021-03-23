import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

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

  @ApiProperty()
  existingPV: boolean;

  @ApiProperty()
  originalInstaller: string;

  @ApiProperty()
  existingPVSize: number;

  @ApiProperty()
  yearSystemInstalled: number;

  @ApiProperty()
  inverter: INVERTER_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  financeType: FINANCE_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  inverterManufacturer: string;

  @ApiProperty()
  inverterModel: string;

  @ApiProperty()
  tpoFundingSource: string;

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
    this.existingPV = props.existingPV;
    this.originalInstaller = props.originalInstaller;
    this.existingPVSize = props.existingPVSize;
    this.yearSystemInstalled = props.yearSystemInstalled;
    this.inverter = props.inverter;
    this.financeType = props.financeType;
    this.inverterManufacturer = props.inverterManufacturer;
    this.inverterModel = props.inverterModel;
    this.tpoFundingSource = props.tpoFundingSource;
  }
}

export class GetRelatedInformationRes implements ServiceResponse<GetRelatedInformationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetRelatedInformationDto })
  data: GetRelatedInformationDto;
}
