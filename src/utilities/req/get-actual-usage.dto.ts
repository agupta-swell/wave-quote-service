import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ActualUsageDto, TypicalBaselineUsageDto } from './sub-dto';

class UtilityDataDto {
  @ApiProperty()
  @IsOptional()
  opportunityId: string;

  @ApiProperty({ type: TypicalBaselineUsageDto })
  @IsNotEmpty()
  @Type(() => TypicalBaselineUsageDto)
  @ValidateNested()
  typicalBaselineUsage: TypicalBaselineUsageDto;

  @ApiProperty({ type: ActualUsageDto })
  @IsNotEmpty()
  @Type(() => ActualUsageDto)
  @ValidateNested()
  actualUsage: ActualUsageDto;
}

class CostDetailDto {
  @ApiProperty()
  @IsDateString()
  startDate: Date;

  @ApiProperty()
  @IsDateString()
  endDate: Date;

  @ApiProperty()
  @IsNumber()
  i: number;

  @ApiProperty()
  @IsNumber()
  v: number;
}

class UtilityCostDataDto {
  @ApiProperty()
  @IsDateString()
  startDate: Date;

  @ApiProperty()
  @IsDateString()
  endDate: Date;

  @ApiProperty()
  @IsString()
  interval: string;

  @ApiProperty({ type: CostDetailDto, isArray: true })
  @IsArray()
  @Type(() => CostDetailDto)
  @ValidateNested({ each: true })
  cost: CostDetailDto[];
}

class CostDataDto {
  @ApiProperty()
  @IsOptional()
  opportunityId: string;

  @ApiProperty()
  @IsString()
  masterTariffId: string;

  @ApiProperty({ type: UtilityCostDataDto })
  @IsNotEmpty()
  @Type(() => UtilityCostDataDto)
  @ValidateNested()
  typicalUsageCost: UtilityCostDataDto;

  @ApiProperty({ type: UtilityCostDataDto })
  @IsNotEmpty()
  @Type(() => UtilityCostDataDto)
  @ValidateNested()
  actualUsageCost: UtilityCostDataDto;
}

export class GetActualUsageDto {
  @ApiProperty({ type: CostDataDto })
  @IsNotEmpty()
  @Type(() => CostDataDto)
  @ValidateNested()
  costData: CostDataDto;

  @ApiProperty({ type: UtilityDataDto })
  @IsNotEmpty()
  @Type(() => UtilityDataDto)
  @ValidateNested()
  utilityData: UtilityDataDto;
}
