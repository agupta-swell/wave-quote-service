import { Default, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { IExistingSystemProduction } from '../utility.schema';

export class LoadServingEntity {
  @ExposeProp()
  lseName: string;

  @ExposeProp()
  lseCode: string;

  @ExposeProp()
  zipCode: number;

  @ExposeProp()
  serviceType: string;

  @ExposeProp()
  lseId: string;
}

export class UsageValueDto {
  @ExposeProp()
  i: number;

  @ExposeProp()
  v: number;
}

export class TypicalBaseLine {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  zipCode: number;

  @ExposeProp()
  buildingType: string;

  @ExposeProp()
  customerClass: string;

  @ExposeProp()
  lseName: string;

  @ExposeProp()
  lseId: number;

  @ExposeProp()
  sourceType: string;

  @ExposeProp()
  annualConsumption: number;

  @ExposeProp({ type: UsageValueDto })
  typicalMonthlyUsage: UsageValueDto[];

  @ExposeProp({ type: UsageValueDto })
  typicalHourlyUsage: UsageValueDto[];
}

export class ActualUsageDto {
  @ExposeProp()
  zipCode: number;

  @ExposeProp()
  sourceType: string;

  @ExposeProp()
  annualConsumption: number;

  @ExposeProp({ type: UsageValueDto, isArray: true })
  monthlyUsage: UsageValueDto[];

  @ExposeProp({ type: UsageValueDto, isArray: true })
  hourlyUsage: UsageValueDto[];
}

export class ComputedUsageDto {
  @ExposeProp()
  annualConsumption: number;

  @ExposeProp({ type: UsageValueDto, isArray: true })
  monthlyUsage: UsageValueDto[];

  @ExposeProp({ type: UsageValueDto, isArray: true })
  hourlyUsage?: UsageValueDto[];
}

export class ExistingSystemProductionDto implements IExistingSystemProduction {
  @ExposeProp()
  annualProduction: number;

  @ExposeProp({ type: UsageValueDto, isArray: true })
  monthlyProduction: UsageValueDto[];

  @ExposeProp()
  hourlyProduction: number[];
}

export class UtilityDataDto {
  @ExposeProp({ type: LoadServingEntity })
  loadServingEntityData: LoadServingEntity;

  @ExposeProp({ type: TypicalBaseLine })
  @Default({} as TypicalBaseLine)
  typicalBaselineUsage: TypicalBaseLine;

  @ExposeProp({ type: ActualUsageDto })
  actualUsage: ActualUsageDto;

  @ExposeProp({ type: ComputedUsageDto })
  computedUsage: ComputedUsageDto;

  static actualUsages(props: any): UtilityDataDto {
    return strictPlainToClass(UtilityDataDto, props);
  }
}

export class MonthSeasonTariffDto {
  @ExposeProp()
  seasonName: string;

  @ExposeProp()
  hourlyTariffRate: number[]; 
}
