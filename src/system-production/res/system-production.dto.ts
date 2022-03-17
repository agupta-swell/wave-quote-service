import { ExposeMongoId, ExposeProp } from '../../shared/decorators';

export class SystemProductionDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  capacityKW: number;

  @ExposeProp()
  generationKWh: number;

  @ExposeProp()
  productivity: number;

  @ExposeProp()
  annualUsageKWh: number;

  @ExposeProp()
  offsetPercentage: number;

  @ExposeProp()
  generationMonthlyKWh: number[];

  @ExposeProp()
  arrayGenerationKWh: number[];

  @ExposeProp()
  hourlyProduction: string;
}
