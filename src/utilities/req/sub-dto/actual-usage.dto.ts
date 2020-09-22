import { ApiProperty } from '@nestjs/swagger';

class TypicalUsage {
  @ApiProperty()
  i: number;

  @ApiProperty()
  v: number;
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
