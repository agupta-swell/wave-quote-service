import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from '../../app/common';
import { Product } from '../product.schema';
import { ServiceResponse } from './../../app/common/service-response';

export class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  manufacturer: string;

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
    this.id = props.id;
    this.manufacturer = props.manufacturer;
    this.name = props.name;
    this.type = props.type;
    this.price = props.price;
    this.sizeW = props.sizeW;
    this.sizekWh = props.sizekWh;
    this.partNumber = props.partNumber;
    this.dimension = props.dimension;
  }
}

class ProductPaginationRes implements Pagination<ProductDto> {
  @ApiProperty({
    type: ProductDto,
    isArray: true,
  })
  data: ProductDto[];

  @ApiProperty()
  total: number;
}

export class ProductResponse implements ServiceResponse<ProductPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProductPaginationRes })
  data: ProductPaginationRes;
}
