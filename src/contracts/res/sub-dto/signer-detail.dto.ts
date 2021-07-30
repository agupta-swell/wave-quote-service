import { ExposeProp } from 'src/shared/decorators';
import { SIGN_STATUS } from '../../constants';

export class SignerDetailResDto {
  @ExposeProp()
  roleId: string;

  @ExposeProp()
  role: string;

  @ExposeProp()
  firstName: string;

  @ExposeProp()
  lastName: string;

  @ExposeProp()
  email: string;

  @ExposeProp()
  signStatus: SIGN_STATUS;

  @ExposeProp()
  sentOn: Date;

  @ExposeProp()
  signedOn: Date;

  @ExposeProp({ required: false })
  phoneNumber: string;
}
