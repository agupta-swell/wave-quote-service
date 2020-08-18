import { ApiProperty } from '@nestjs/swagger';

export class Pagination<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  constructor(props: any) {
    this.total = props.total;
    this.data = props.data;
  }
}
