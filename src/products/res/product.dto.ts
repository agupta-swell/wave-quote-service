import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class ProductDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  manufacturerId: string;

  @ExposeProp()
  manufacturer: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  type: string;

  @ExposeProp()
  price: number;

  @ExposeProp()
  sizeW: number;

  @ExposeProp()
  sizekWh: number;

  @ExposeProp()
  partNumber: string[];

  @ExposeProp()
  dimension: {
    length: number;
    width: number;
  };

  // @ExposeProp()
  // modelName: string;

  @ExposeProp()
  approvedForGsa: boolean;

  @ExposeProp()
  approvedForEsa: boolean;

  @ExposeProp({ required: false })
  pvWattModuleType: string;

  @ExposeProp({ required: false })
  panelOutputMode: string;

  @ExposeProp({ required: false })
  wattClassStcdc: number;

  @ExposeProp({ required: false })
  inverterType: string;

  @ExposeProp({ required: false })
  batteryType: string;

  @ExposeProp({ required: false })
  relatedComponent: string;

  @ExposeProp({ required: false })
  insertionRule: string | undefined;
}

class ProductPaginationRes implements Pagination<ProductDto> {
  @ExposeProp({
    type: ProductDto,
    isArray: true,
  })
  data: ProductDto[];

  @ExposeProp()
  total: number;
}

export class ProductResponse implements ServiceResponse<ProductPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProductPaginationRes })
  data: ProductPaginationRes;
}
