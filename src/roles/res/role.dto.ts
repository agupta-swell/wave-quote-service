import { Role } from '../role.schema';

export class RoleDto {
  id: string;
  name: string;

  constructor(props: Role) {
    this.id = props._id;
    this.name = props.name;
  }
}
