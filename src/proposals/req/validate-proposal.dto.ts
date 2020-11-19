import { ApiProperty } from '@nestjs/swagger';

export class CustomerInformationDto {
  email: string;
  houseNumber: string;
  zipCode: number;
}

export class ValidateProposalDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  customerInformation: CustomerInformationDto;
}
