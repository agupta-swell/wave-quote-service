import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ type: TypicalUsage, isArray: true })
  typicalMonthlyUsage: TypicalUsage[];
}
