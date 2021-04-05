import { ApiProperty } from '@nestjs/swagger';
import { RATE_NAME_TYPE, SCENARIO_TYPE } from 'src/saving-calculations/constants';

class CostData {
  @ApiProperty()
  cost: number;

  @ApiProperty()
  yearMonth: Date;
}

class SavingData {
  @ApiProperty({ type: CostData, isArray: true })
  costDataDetail: CostData[];

  @ApiProperty({ enum: RATE_NAME_TYPE })
  rateNameType: RATE_NAME_TYPE;
}

export class ScenarioDataDto {
  @ApiProperty({ type: SavingData, isArray: true })
  savingsDataDetail: SavingData[];

  @ApiProperty({ enum: SCENARIO_TYPE })
  scenarioType: SCENARIO_TYPE;
}
