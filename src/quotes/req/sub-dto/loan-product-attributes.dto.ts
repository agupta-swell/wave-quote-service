import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class LoanProductAttributesDto {
  @ApiProperty()
  @IsNumber()
  upfrontPayment: number;

  @ApiProperty()
  @IsNumber()
  loanAmount: number;

  @ApiProperty()
  @IsNumber()
  interestRate: number;

  @ApiProperty()
  @IsNumber()
  loanTerm: number;

  @ApiProperty()
  @IsNumber()
  monthlyLoanPayment: number;

  @ApiProperty()
  @IsNumber()
  currentMonthlyAverageUtilityPayment: number;

  @ApiProperty()
  @IsNumber()
  monthlyUtilityPayment: number;

  @ApiProperty()
  @IsNumber()
  gridServicePayment: number;

  @ApiProperty()
  @IsNumber()
  netCustomerEnergySpend: number;

  @ApiProperty()
  @IsNumber()
  returnOnInvestment: number;

  @ApiProperty()
  @IsNumber()
  payBackPeriod: number;
}
