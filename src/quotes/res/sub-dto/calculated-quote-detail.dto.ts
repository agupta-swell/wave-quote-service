import { ApiProperty } from '@nestjs/swagger';

export class CalculatedQuoteDetailDto {
  @ApiProperty()
  initialCost: number;

  @ApiProperty()
  costPerWatt: number;

  @ApiProperty()
  monthlyPayment: number;

  @ApiProperty()
  initialPayment: number;

  @ApiProperty()
  solarRate: number;
}
