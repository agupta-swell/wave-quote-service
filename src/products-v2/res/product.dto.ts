import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeAndMap, ExposeIf, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { BATTERY_TYPE, INVERTER_TYPE, PRODUCT_TYPE } from '../constants';
import { IUnknownProduct } from '../interfaces';
import { DimensionResDto } from './dimension-res.dto';
import { BaseRatingResDto, BatteryRatingResDto } from './rating-res.dto';

export class ProductResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  type: PRODUCT_TYPE;

  @ExposeProp()
  partNumbers: number[];

  @ExposeProp()
  cost: number;

  @ExposeIf<IUnknownProduct>(
    obj =>
      obj.type === PRODUCT_TYPE.ADDER || obj.type === PRODUCT_TYPE.BALANCE_OF_SYSTEM || obj.type === PRODUCT_TYPE.LABOR,
  )
  pricingUnit?: string;

  @ExposeIf<IUnknownProduct>(obj => obj.type === PRODUCT_TYPE.SOFT_COST)
  description?: string;

  @ExposeIf<IUnknownProduct>(
    obj => obj.type === PRODUCT_TYPE.ANCILLARY_EQUIPMENT || obj.type === PRODUCT_TYPE.BALANCE_OF_SYSTEM,
  )
  relatedComponent?: string;

  @ExposeIf<IUnknownProduct>(
    obj => obj.type === PRODUCT_TYPE.ANCILLARY_EQUIPMENT || obj.type === PRODUCT_TYPE.BALANCE_OF_SYSTEM || obj.type === PRODUCT_TYPE.SOFT_COST,
  )
  insertionRule?: string;

  @ExposeIf<IUnknownProduct>(obj => obj.type === PRODUCT_TYPE.BATTERY)
  batteryType?: BATTERY_TYPE;

  @ExposeIf<IUnknownProduct>(obj => obj.type === PRODUCT_TYPE.BATTERY)
  minimumReservePercentage?: number;

  @ExposeIf<IUnknownProduct>(obj => obj.type === PRODUCT_TYPE.BATTERY)
  roundTripEfficiency?: number;

  @ExposeIf<IUnknownProduct>(obj => obj.type === PRODUCT_TYPE.INVERTER)
  inverterType?: INVERTER_TYPE;

  @ExposeAndMap({ type: DimensionResDto }, ({ obj, value }) => {
    if (obj.type === PRODUCT_TYPE.MODULE) return value;
  })
  dimensions?: DimensionResDto;

  @ExposeAndMap({}, ({ obj }) => obj.manufacturerId)
  manufacturerId?: string;

  @ExposeAndMap({ skipTransform: true }, ({ obj, value }) => {
    let res: BaseRatingResDto | BatteryRatingResDto | undefined;

    switch (obj.type) {
      case PRODUCT_TYPE.BATTERY:
        res = strictPlainToClass(BatteryRatingResDto, value);
        break;
      case PRODUCT_TYPE.INVERTER:
      case PRODUCT_TYPE.MODULE:
        res = strictPlainToClass(BaseRatingResDto, value);
        break;
      default:
        res = undefined;
    }

    return res;
  })
  ratings?: BaseRatingResDto | BatteryRatingResDto;
}

class ProductPaginationRes implements Pagination<ProductResDto> {
  @ExposeProp({
    type: ProductResDto,
    isArray: true,
  })
  data: ProductResDto[];

  @ExposeProp()
  total: number;
}

export class ProductResponse implements ServiceResponse<ProductPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProductPaginationRes })
  data: ProductPaginationRes;
}
