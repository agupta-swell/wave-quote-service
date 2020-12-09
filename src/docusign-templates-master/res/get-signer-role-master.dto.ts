import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { SignerRoleMaster } from '../schemas';

class SignerRoleData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roleName: string;

  @ApiProperty()
  roleDescription: string;
}

export class GetSignerRoleMasterDto {
  @ApiProperty({ type: SignerRoleData, isArray: true })
  recipientRoles: SignerRoleData[];

  constructor(props: SignerRoleMaster[]) {
    this.recipientRoles = props?.map(item => ({
      id: item._id,
      roleName: item.role_name,
      roleDescription: item.role_description,
    }));
  }
}

export class GetSignerRoleMasterRes implements ServiceResponse<GetSignerRoleMasterDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetSignerRoleMasterDto })
  data: GetSignerRoleMasterDto;
}
