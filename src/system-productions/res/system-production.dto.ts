import { ExposeMongoId, ExposeProp } from '../../shared/decorators';
import { IDerateSnapshot, IEnergyProfileProduction } from '../system-production.schema';

export class PvWattProductionDto implements IEnergyProfileProduction {
  @ExposeProp()
  annualAverage: number[];

  @ExposeProp()
  monthlyAverage: number[][];
}

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

  @ExposeProp()
  pvWattProduction: PvWattProductionDto;

  @ExposeProp()
  derateSnapshot: IDerateSnapshot;
}
