import { ApiProperty } from '@nestjs/swagger';
import { toCamelCase } from '../../utils/transformProperties';

export class LoadServingEntity {
  @ApiProperty()
  lseName: string;

  @ApiProperty()
  lseCode: string;

  @ApiProperty()
  zipCode: number;

  @ApiProperty()
  serviceType: string;

  @ApiProperty()
  lseId: string;
}

export class TypicalUsage {
  @ApiProperty()
  i: number;

  @ApiProperty()
  v: number;
}

export class TypicalBaseLine {
  @ApiProperty()
  zipCode: number;

  @ApiProperty()
  buildingType: string;

  @ApiProperty()
  customerClass: string;

  @ApiProperty()
  lseName: string;

  @ApiProperty()
  lseId: number;

  @ApiProperty()
  sourceType: string;

  @ApiProperty()
  annualConsumption: number;

  @ApiProperty({ type: TypicalUsage })
  typicalMonthlyUsage: TypicalUsage[];

  typicalHourlyUsage: TypicalUsage[];
}

export class ActualUsageDto {
  @ApiProperty()
  zipCode: number;

  @ApiProperty()
  sourceType: string;

  @ApiProperty()
  annualConsumption: number;

  @ApiProperty({ type: TypicalUsage, isArray: true })
  monthlyUsage: TypicalUsage[];
}

export class UtilityDataDto {
  @ApiProperty({ type: LoadServingEntity })
  loadServingEntityData: LoadServingEntity;

  @ApiProperty({ type: TypicalBaseLine })
  typicalBaselineUsage: TypicalBaseLine;

  @ApiProperty({ type: ActualUsageDto })
  actualUsage: ActualUsageDto;

  constructor(props: any, isInternal = false) {
    this.loadServingEntityData = toCamelCase(props?.loadServingEntityData);
    if (!isInternal) {
      props?.typicalBaselineUsage?.typical_baseline &&
        delete props.typicalBaselineUsage.typical_baseline.typical_hourly_usage;
    }
    this.typicalBaselineUsage = toCamelCase(props?.typicalBaselineUsage?.typical_baseline);
    // FIXME: need to fix later
    this.actualUsage = {} as any;
  }

  static actualUsages(props: any) {
    const utility = new UtilityDataDto(null);
    utility.loadServingEntityData = props.loadServingEntityData;
    utility.typicalBaselineUsage = props.typicalBaselineUsage;
    utility.actualUsage = props.actualUsage;
    return utility;
  }
}
