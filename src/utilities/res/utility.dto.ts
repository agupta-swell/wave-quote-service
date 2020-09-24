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

  @ApiProperty()
  typicalMonthlyUsage: TypicalUsage[];
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

export class UtilityDto {
  @ApiProperty({ type: LoadServingEntity })
  loadServingEntityData: LoadServingEntity;

  @ApiProperty({ type: TypicalBaseLine })
  typicalBaselineUsage: TypicalBaseLine;

  @ApiProperty({ type: ActualUsageDto })
  actualUsage: ActualUsageDto;

  constructor(props: any) {
    this.loadServingEntityData = toCamelCase(props?.loadServingEntityData);
    props?.typicalBaselineUsage?.typical_baseline &&
      delete props.typicalBaselineUsage.typical_baseline.typical_hourly_usage;
    this.typicalBaselineUsage = toCamelCase(props?.typicalBaselineUsage.typical_baseline);
  }

  static actualUsages(props: any) {
    const utility = new UtilityDto(null);
    utility.loadServingEntityData = props.loadServingEntityData;
    utility.typicalBaselineUsage = props.typicalBaselineUsage;
    utility.actualUsage = props.actualUsage;
    return utility;
  }
}
