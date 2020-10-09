import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class TypicalUsage {
  @ApiProperty()
  i: number;

  @ApiProperty()
  v: number;
}

export class TypicalBaselineUsageDto {
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

  @ApiProperty({ type: () => TypicalUsage, isArray: true, default: [{ i: 1, v: 2 }] })
  @Type(() => TypicalUsage)
  typicalMonthlyUsage: TypicalUsage[];
}
