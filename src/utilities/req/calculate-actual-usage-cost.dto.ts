import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { ActualUsageDto, TypicalBaselineUsageDto } from './sub-dto';

class UtilityData {
  @ApiProperty({ type: TypicalBaselineUsageDto })
  @Type(() => TypicalBaselineUsageDto)
  @IsNotEmpty()
  @ValidateNested()
  typicalBaselineUsage: TypicalBaselineUsageDto;

  @ApiProperty({ type: ActualUsageDto })
  @Type(() => ActualUsageDto)
  @IsNotEmpty()
  @ValidateNested()
  actualUsage: ActualUsageDto;
}

export class CalculateActualUsageCostDto {
  @ApiProperty()
  masterTariffId: string;

  @ApiProperty()
  @IsNumberString()
  zipCode: number;

  @ApiProperty({ type: UtilityData })
  @Type(() => UtilityData)
  @IsNotEmpty()
  @ValidateNested()
  utilityData: UtilityData;
}
