import { ApiProperty } from '@nestjs/swagger';

export class LoanProductAttributesDto {
  @ApiProperty()
  upfrontPayment: number;

  @ApiProperty()
  loanAmount: number;

  @ApiProperty()
  interestRate: number;

  @ApiProperty()
  loanTerm: number;

  @ApiProperty()
  monthlyLoanPayment: number;

  @ApiProperty()
  currentMonthlyAverageUtilityPayment: number;

  @ApiProperty()
  monthlyUtilityPayment: number;

  @ApiProperty()
  gridServicePayment: number;

  @ApiProperty()
  netCustomerEnergySpend: number;

  @ApiProperty()
  returnOnInvestment: number;

  @ApiProperty()
  payBackPeriod: number;
}
