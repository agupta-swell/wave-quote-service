import { ApiProperty } from '@nestjs/swagger';
import { ActualUsageDto, TypicalBaselineUsageDto } from './sub-dto';

class UtilityDataDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty({ type: () => TypicalBaselineUsageDto })
  typicalBaselineUsage: TypicalBaselineUsageDto;

  @ApiProperty({ type: () => ActualUsageDto })
  actualUsage: ActualUsageDto;
}

class CostDetailDto {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  i: number;

  @ApiProperty()
  v: number;
}

class UtilityCostDataDto {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  interval: string;

  @ApiProperty({ type: CostDetailDto, isArray: true })
  cost: CostDetailDto[];
}

class CostDataDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  masterTariffId: string;

  @ApiProperty({ type: UtilityCostDataDto })
  typicalUsageCost: UtilityCostDataDto;

  @ApiProperty({ type: UtilityCostDataDto })
  actualUsageCost: UtilityCostDataDto;
}

export class GetActualUsageDto {
  @ApiProperty({ type: CostDataDto })
  costData: CostDataDto;

  @ApiProperty({ type: UtilityDataDto })
  utilityData: UtilityDataDto;
}
