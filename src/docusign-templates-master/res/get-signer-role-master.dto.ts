import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { SignerRoleDataResDto } from './sub-dto';

export class GetSignerRoleMasterDto {
  @ExposeProp({ type: SignerRoleDataResDto, isArray: true })
  recipientRoles: SignerRoleDataResDto[];
}

export class GetSignerRoleMasterRes implements ServiceResponse<GetSignerRoleMasterDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetSignerRoleMasterDto })
  data: GetSignerRoleMasterDto;
}
