import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumberString, IsOptional, ValidateNested } from 'class-validator';
import { TypicalBaselineUsageDto, ComputedUsageDto } from './sub-dto';

class UtilityData {
  @ApiProperty({ type: TypicalBaselineUsageDto })
  @Type(() => TypicalBaselineUsageDto)
  @IsNotEmpty()
  @ValidateNested()
  typicalBaselineUsage: TypicalBaselineUsageDto;

  @ApiProperty({ type: ComputedUsageDto })
  @Type(() => ComputedUsageDto)
  @IsNotEmpty()
  @ValidateNested()
  computedUsage: ComputedUsageDto;
}

export class CalculateActualUsageCostDto {
  @ApiProperty()
  masterTariffId: string;

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  usageProfileId?: string;

  @ApiProperty({ type: UtilityData })
  @Type(() => UtilityData)
  @IsNotEmpty()
  @ValidateNested()
  utilityData: UtilityData;

  @ApiProperty()
  @IsOptional()
  opportunityId: string;
}
