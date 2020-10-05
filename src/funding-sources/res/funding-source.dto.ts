import { ApiProperty } from '@nestjs/swagger';

export class FundingSourceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  constructor(props: any) {
    this.id = props._id;
    this.name = props.name;
    this.type = props.type;
  }
}
