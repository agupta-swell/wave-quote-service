import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { INTERVAL_VALUE } from '../constants';

class CostDetailData {
  @ExposeProp()
  startDate: Date;

  @ExposeProp()
  endDate: Date;

  @ExposeAndMap({}, ({obj}) => obj.startDate)
  start_date: Date;

  @ExposeAndMap({}, ({obj}) => obj.endDate)
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
}

export class CostDataDto {
  @ExposeProp()
  masterTariffId: string;

  @ExposeProp({ type: UtilityCostData })
  typicalUsageCost: UtilityCostData;

  @ExposeProp({ type: UtilityCostData })
  actualUsageCost: UtilityCostData | undefined;

  @ExposeProp()
  postInstallMasterTariffId: string;
}
