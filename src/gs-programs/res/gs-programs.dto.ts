import { Pagination, ServiceResponse } from 'src/app/common';
import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { UtilityProgramMasterDto } from 'src/utility-programs-master/res/utility-program-master.dto';
import { compareIds } from 'src/utils/common';

export class GsProgramsDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  annualIncentives: number;

  @ExposeProp()
  termYears: string;

  @ExposeProp()
  kilowattHours: number;

  @ExposeProp()
  upfrontIncentives: number;

  @ExposeProp()
  manufacturerId: string;

  @ExposeProp({ type: UtilityProgramMasterDto })
  utilityProgram?: UtilityProgramMasterDto;

  @ExposeAndMap({ type: ProductResDto }, params =>
    params.obj.battery?.find(({ manufacturerId }) => compareIds(manufacturerId, params.obj.manufacturerId)),
  )
  battery?: ProductResDto;

  @ExposeAndMap({}, ({ obj }) => obj.createdAt)
  created_at: string;

  @ExposeAndMap({}, ({ obj }) => obj.updatedAt)
  updated_at: string;

  @ExposeProp()
  createdAt: string;

  @ExposeProp()
  updatedAt: string;
}

class GsProgramsPaginationDto implements Pagination<GsProgramsDto> {
  @ExposeProp({
    type: GsProgramsDto,
    isArray: true,
  })
  data: GsProgramsDto[];

  @ExposeProp()
  total: number;
}

export class GsProgramsPaginationRes implements ServiceResponse<GsProgramsPaginationDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GsProgramsPaginationDto })
  data: GsProgramsPaginationDto;
}
