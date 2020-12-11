import { ApiProperty } from '@nestjs/swagger';
import { SIGN_STATUS } from './../../constants';

export class SignerDetailResDto {
  @ApiProperty()
  roleId: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  signStatus: SIGN_STATUS;

  @ApiProperty()
  sentOn: Date;

  @ApiProperty()
  signedOn: Date;
}
