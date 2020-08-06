export class Pagination<T> {
  data: T[];
  total: number;

  constructor(props: any) {
    this.total = props.total;
    this.data = props.data;
  }
}
