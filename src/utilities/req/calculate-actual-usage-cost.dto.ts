import { ApiProperty } from '@nestjs/swagger';
import { ActualUsageDto, TypicalBaselineUsageDto } from './sub-dto';

class UtilityData {
  @ApiProperty({ type: TypicalBaselineUsageDto })
  typicalBaselineUsage: TypicalBaselineUsageDto;

  @ApiProperty({ type: ActualUsageDto })
  actualUsage: ActualUsageDto;
}

export class CalculateActualUsageCostDto {
  @ApiProperty()
  masterTariffId: string;

  @ApiProperty()
  zipCode: number;

  @ApiProperty({ type: UtilityData })
  utilityData: UtilityData;
}
