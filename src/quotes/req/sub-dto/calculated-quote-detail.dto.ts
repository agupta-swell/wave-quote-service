import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CalculatedQuoteDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  initialCost: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  costPerWatt: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  monthlyPayment: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  initialPayment: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  solarRate: number;
}
