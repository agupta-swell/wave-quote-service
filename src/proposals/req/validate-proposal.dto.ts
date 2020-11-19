import { ApiProperty } from '@nestjs/swagger';

export class ValidateProposalDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  customerInformation:any
}
