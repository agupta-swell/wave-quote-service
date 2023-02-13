import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { IDerateSnapshot } from '../system-production.schema';

export class UpdateSystemProductionDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  capacityKW?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  generationKWh?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  productivity?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  annualUsageKWh?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  offsetPercentage?: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  generationMonthlyKWh?: number[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  arrayGenerationKWh?: number[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  hourlyProduction?: string;

  derateSnapshot?: IDerateSnapshot;
}
