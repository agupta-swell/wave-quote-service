import { ApiProperty } from '@nestjs/swagger';
import { FundingSource } from '../funding-source.schema';

export class FundingSourceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  constructor(props: FundingSource) {
    this.id = props._id;
    this.name = props.name;
    this.type = props.type;
  }
}
