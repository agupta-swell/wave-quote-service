import { User } from '../user.schema';

export class UserDto {
  id: string;

  constructor(props: User) {
    this.id = props._id;
  }
}
