import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, IsDate } from 'class-validator';
import { BATTERY_PURPOSE } from 'src/system-designs/constants';

export class BatterySystemSpecsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalRatingInKW: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalCapacityInKWh: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  roundTripEfficiency: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  minimumReserve: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(BATTERY_PURPOSE)
  operationMode: BATTERY_PURPOSE;
}

export class GetPinballSimulatorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  hourlyPostInstallLoad: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { each: true })
  hourlySeriesForExistingPV?: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  hourlySeriesForNewPV: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  postInstallMasterTariffId: string;

  @ApiProperty({ type: BatterySystemSpecsDto })
  @Type(() => BatterySystemSpecsDto)
  @IsNotEmpty()
  @ValidateNested()
  batterySystemSpecs: BatterySystemSpecsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  year?: number;

  @IsNumber()
  zipCode: number;
}

export class GetPinballSimulatorAndCostPostInstallationDto extends GetPinballSimulatorDto {
  @Type(() => Date)
  @IsDate()
  startDate: Date;
}
