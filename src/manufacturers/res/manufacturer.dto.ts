import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class ManufacturerDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;
}

class ManufacturerPaginationDto implements Pagination<ManufacturerDto> {
  @ExposeProp({
    type: ManufacturerDto,
    isArray: true,
  })
  data: ManufacturerDto[];

  @ExposeProp()
  total: number;
}

export class ManufacturerPaginationRes implements ServiceResponse<ManufacturerPaginationDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ManufacturerPaginationDto })
  data: ManufacturerPaginationDto;
}
