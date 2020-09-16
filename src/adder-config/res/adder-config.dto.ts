import { ApiProperty } from '@nestjs/swagger';
import { AdderConfig } from '../adder-config.schema';

export class AdderConfigDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  adder: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  increment: string;

  @ApiProperty()
  modifiedAt: Date;

  constructor(props: AdderConfig) {
    this.id = props.id;
    this.adder = props.adder;
    this.price = props.price;
    this.increment = props.increment;
    this.modifiedAt = props.modifiedAt;
  }
}
