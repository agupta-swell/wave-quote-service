import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';

export class SystemProductionDto {
  @ExposeProp()
  capacityKW: number;

  @ExposeProp()
  generationKWh: number;

  @ExposeProp()
  productivity: number;

  @ExposeAndMap({}, ({ value }) => value || 0)
  annualUsageKWh: number;

  @ExposeProp()
  offsetPercentage: number;

  @ExposeProp()
  generationMonthlyKWh: number[];
}
