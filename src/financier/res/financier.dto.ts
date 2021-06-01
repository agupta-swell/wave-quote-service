import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Financier } from '../financier.schema';

export class FinancierDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(props: LeanDocument<Financier> | Financier) {
    this.id = props._id;
    this.name = props.name;
  }
}
