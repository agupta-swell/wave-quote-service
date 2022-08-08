import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { OPERATION_MODE } from '../constants';

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
  @IsEnum(OPERATION_MODE)
  operationMode: OPERATION_MODE;
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
}
