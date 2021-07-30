import { RATE_NAME_TYPE, SCENARIO_TYPE } from 'src/saving-calculations/constants';
import { ExposeProp } from 'src/shared/decorators';

class CostData {
  @ExposeProp()
  cost: number;

  @ExposeProp()
  yearMonth: Date;
}

class SavingData {
  @ExposeProp({ type: CostData, isArray: true })
  costDataDetail: CostData[];

  @ExposeProp({ enum: RATE_NAME_TYPE })
  rateNameType: RATE_NAME_TYPE;
}

export class ScenarioDataDto {
  @ExposeProp({ type: SavingData, isArray: true })
  savingsDataDetail: SavingData[];

  @ExposeProp({ enum: SCENARIO_TYPE })
  scenarioType: SCENARIO_TYPE;
}
