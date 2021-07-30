import { ExposeProp } from 'src/shared/decorators';

export class LoanProductAttributesDto {
  @ExposeProp()
  upfrontPayment: number;

  @ExposeProp()
  loanAmount: number;

  @ExposeProp()
  interestRate: number;

  @ExposeProp()
  loanTerm: number;

  @ExposeProp()
  monthlyLoanPayment: number;

  @ExposeProp()
  currentMonthlyAverageUtilityPayment: number;

  @ExposeProp()
  monthlyUtilityPayment: number;

  @ExposeProp()
  gridServicePayment: number;

  @ExposeProp()
  netCustomerEnergySpend: number;

  @ExposeProp()
  returnOnInvestment: number;

  @ExposeProp()
  payBackPeriod: number;
}
