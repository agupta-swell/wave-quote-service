import { ApiProperty } from '@nestjs/swagger';
import { toCamelCase } from '../../utils/transformProperties';
import { INTERVAL_VALUE } from './../constants';
import { ICostData } from './../utility.schema';

class CostDetailData {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  i: number;

  @ApiProperty()
  v: number;
}

class UtilityCostData {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  interval: INTERVAL_VALUE;

  @ApiProperty({ type: CostDetailData, isArray: true })
  cost: CostDetailData[];
}

export class CostData {
  @ApiProperty()
  masterTariffId: string;

  @ApiProperty({ type: UtilityCostData })
  typicalUsageCost: UtilityCostData;

  @ApiProperty()
  actualUsageCost: UtilityCostData | null;

  constructor(props: ICostData) {
    this.masterTariffId = props.master_tariff_id;
    this.typicalUsageCost = props.typical_usage_cost && {
      ...toCamelCase(props.typical_usage_cost),
      cost: props.typical_usage_cost.cost.map(item => toCamelCase(item)),
    };
    this.actualUsageCost = props.actual_usage_cost && {
      ...toCamelCase(props.actual_usage_cost),
      cost: props.actual_usage_cost.cost.map(item => toCamelCase(item)),
    };
  }
}
