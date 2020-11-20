import { ApiProperty } from '@nestjs/swagger';

export class CustomerInformationDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  houseNumber: string;

  @ApiProperty()
  zipCode: number;
}

export class ValidateProposalDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  customerInformation: CustomerInformationDto;
}
