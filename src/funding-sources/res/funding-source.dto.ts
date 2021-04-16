import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { FundingSource } from '../funding-source.schema';

export class FundingSourceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  rebateAssignment: string;

  constructor(props: LeanDocument<FundingSource>) {
    this.id = props._id;
    this.name = props.name;
    this.type = props.type;
    this.rebateAssignment = props.rebateAssignment;
  }
}
