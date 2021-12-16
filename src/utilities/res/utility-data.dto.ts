import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';

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

export class TypicalUsage {
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

  @ExposeProp({ type: TypicalUsage })
  typicalMonthlyUsage: TypicalUsage[];

  @ExposeProp({ type: TypicalUsage })
  typicalHourlyUsage: TypicalUsage[];
}

export class ActualUsageDto {
  @ExposeProp()
  zipCode: number;

  @ExposeProp()
  sourceType: string;

  @ExposeProp()
  annualConsumption: number;

  @ExposeProp({ type: TypicalUsage, isArray: true })
  monthlyUsage: TypicalUsage[];

  @ExposeProp({ type: TypicalUsage, isArray: true })
  hourlyUsage: TypicalUsage[];
}

export class UtilityDataDto {
  @ExposeProp({ type: LoadServingEntity })
  loadServingEntityData: LoadServingEntity;

  @ExposeAndMap({ type: TypicalBaseLine }, ({ obj, value }) => {
    if (!obj.isInternal && obj?.typicalBaselineUsage?.typicalBaseline) {
      delete obj.typicalBaselineUsage.typicalBaseline.typicalHourlyUsage;
    }

    return obj?.typicalBaselineUsage?.typicalBaseline || value || {};
  })
  typicalBaselineUsage: TypicalBaseLine;

  @ExposeProp({ type: ActualUsageDto, default: {}, noTransformDefault: true })
  actualUsage: ActualUsageDto;

  static actualUsages(props: any): UtilityDataDto {
    return strictPlainToClass(UtilityDataDto, props);
  }
}
