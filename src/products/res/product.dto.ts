import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product.schema';

export class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  sizeW: number;

  @ApiProperty()
  sizekWh: number;

  @ApiProperty()
  partNumber: string[];

  @ApiProperty()
  dimension: {
    length: number;
    width: number;
  };

  constructor(props: Product) {
    console.log('>>>>>>>>>>>>>>>>>>>', 'props', props._id, props.id);
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.price = props.price;
    this.sizeW = props.sizeW;
    this.sizekWh = props.sizekWh;
    this.partNumber = props.partNumber;
    this.dimension = props.dimension;
  }
}
