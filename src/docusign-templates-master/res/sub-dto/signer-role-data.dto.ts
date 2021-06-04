import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class SignerRoleDataResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  roleName: string;

  @ExposeProp()
  roleDescription: string;
}
