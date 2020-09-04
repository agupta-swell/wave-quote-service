import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
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
  partNumber: [string];

  constructor(props: any) {
    Object.assign(this, { ...props, partNumber: props.part_number });
  }
}
