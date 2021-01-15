import { ApiProperty } from '@nestjs/swagger';

interface IProps<T> {
  data: T[];
  total: number;
}

export class Pagination<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  constructor(props: IProps<T>) {
    this.total = props.total;
    this.data = props.data;
  }
}
