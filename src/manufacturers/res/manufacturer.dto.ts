import { Manufacturer } from './../manufacturer.schema';
import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';

export class ManufacturerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(props: Manufacturer) {
    this.id = props._id;
    this.name = props.name;
  }
}

class ManufacturerPaginationDto implements Pagination<ManufacturerDto> {
  @ApiProperty({
    type: ManufacturerDto,
    isArray: true,
  })
  data: ManufacturerDto[];

  @ApiProperty()
  total: number;
}

export class ManufacturerPaginationRes implements ServiceResponse<ManufacturerPaginationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ManufacturerPaginationDto })
  data: ManufacturerPaginationDto;
}
