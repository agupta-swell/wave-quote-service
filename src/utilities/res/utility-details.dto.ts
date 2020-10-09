import { ApiProperty } from '@nestjs/swagger';
import { toCamelCase } from 'src/utils/transformProperties';
import { UtilityUsageDetails } from '../utility.schema';
import { CostDataDto } from './cost-data.dto';
import { UtilityDataDto } from './utility-data.dto';

export class UtilityDetailsDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty({ type: UtilityDataDto })
  utilityData: UtilityDataDto;

  @ApiProperty({ type: CostDataDto })
  costData: CostDataDto;

  constructor(props: UtilityUsageDetails) {
    this.opportunityId = props.opportunity_id;
    this.utilityData = toCamelCase(props.utility_data);
    this.costData = toCamelCase(props.cost_data);
  }
}
