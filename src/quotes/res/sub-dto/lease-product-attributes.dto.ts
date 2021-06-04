import { ExposeProp } from 'src/shared/decorators';

export class LeaseProductAttributesDto {
  @ExposeProp()
  upfrontPayment: number;

  @ExposeProp()
  leaseAmount: number;

  @ExposeProp()
  leaseTerm: number;

  @ExposeProp()
  monthlyLeasePayment: number;

  @ExposeProp()
  currentMonthlyAverageUtilityPayment: number;

  @ExposeProp()
  monthlyUtilityPayment: number;

  @ExposeProp()
  monthlyEnergyPayment: number;

  @ExposeProp()
  gridServicePayment: number;

  @ExposeProp()
  netCustomerEnergySpend: number;

  @ExposeProp()
  returnOnInvestment: number;

  @ExposeProp()
  payBackPeriod: number;
}
