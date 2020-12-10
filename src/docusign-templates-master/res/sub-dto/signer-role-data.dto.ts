import { ApiProperty } from '@nestjs/swagger';

export class SignerRoleDataResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roleName: string;

  @ApiProperty()
  roleDescription: string;
}
