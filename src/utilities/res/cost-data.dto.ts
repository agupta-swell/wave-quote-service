import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { Transform } from 'class-transformer';
import { INTERVAL_VALUE } from '../constants';

class CostDetailData {
  @ExposeProp()
  startDate: Date;

  @ExposeProp()
  endDate: Date;

  @ExposeAndMap({}, ({ obj }) => obj.startDate)
  start_date: Date;

  @ExposeAndMap({}, ({ obj }) => obj.endDate)
  end_date: Date;

  @ExposeProp()
  i: number;

  @ExposeProp()
  v: number;
}

class UtilityCostData {
  @ExposeProp()
  startDate: Date;

  @ExposeProp()
  endDate: Date;

  @ExposeProp()
  interval: INTERVAL_VALUE;

  @ExposeProp({ type: CostDetailData, isArray: true })
  cost: CostDetailData[];

  @ExposeProp()
  @Transform(({ value, obj }) => {
    if (value) return value;
    return obj.cost.reduce((acc, curr) => acc + curr.v, 0);
  })
  annualCost: number;
}

export class CostDataDto {
  @ExposeProp()
  masterTariffId: string;

  @ExposeProp({ type: UtilityCostData })
  typicalUsageCost: UtilityCostData;

  @ExposeProp({ type: UtilityCostData })
  actualUsageCost: UtilityCostData | undefined;

  @ExposeProp({ type: UtilityCostData })
  computedCost: UtilityCostData | undefined;

  @ExposeProp()
  postInstallMasterTariffId: string;

  @ExposeProp({ type: UtilityCostData })
  currentUsageCost: UtilityCostData;

  @ExposeProp({ type: UtilityCostData })
  plannedCost: UtilityCostData;
}
