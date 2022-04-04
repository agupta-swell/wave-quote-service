import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { IPvWattProduction } from '../system-production.schema';

export class CreateSystemProductionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  capacityKW: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  generationKWh: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  productivity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  annualUsageKWh: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  offsetPercentage: number;

  @ApiProperty()
  @IsNumber({}, { each: true })
  generationMonthlyKWh: number[];

  @ApiProperty()
  @IsNumber({}, { each: true })
  arrayGenerationKWh: number[];

  @ApiProperty()
  pvWattProduction: IPvWattProduction;
}
