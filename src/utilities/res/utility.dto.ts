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

export class UtilityDto {
  @ApiProperty()
  loadServingEntityData: LoadServingEntity;

  @ApiProperty()
  typicalBaselineUsage: TypicalBaseLine;

  constructor(props: any) {
    this.loadServingEntityData = toCamelCase(props.loadServingEntityData);
    props.typicalBaselineUsage && delete props.typicalBaselineUsage.typical_baseline.typical_hourly_usage;
    this.typicalBaselineUsage = toCamelCase(props.typicalBaselineUsage.typical_baseline);
  }
}