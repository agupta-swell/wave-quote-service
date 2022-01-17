import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class SystemDesignAncillaryMasterDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  manufacturerId: string;

  @ExposeProp()
  modelName: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  averageWholeSalePrice: number;

  @ExposeProp()
  applicableProductManufacturerId: string;

  @ExposeProp()
  insertionRule: string | undefined;
}

export class AnciallaryMasterRes implements ServiceResponse<SystemDesignAncillaryMasterDto> {
  @ExposeProp({
    type: SystemDesignAncillaryMasterDto,
  })
  data: SystemDesignAncillaryMasterDto;

  @ExposeProp()
  status: string;
}

class AnciallaryMasterPaginationRes implements Pagination<SystemDesignAncillaryMasterDto> {
  @ExposeProp({
    type: SystemDesignAncillaryMasterDto,
    isArray: true,
  })
  data: SystemDesignAncillaryMasterDto[];

  @ExposeProp()
  total: number;
}

export class SystemDesignAncillaryMasterListRes implements ServiceResponse<AnciallaryMasterPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: AnciallaryMasterPaginationRes })
  data: AnciallaryMasterPaginationRes;
}
