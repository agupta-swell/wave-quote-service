import { ApiProperty } from '@nestjs/swagger';

export class LeaseProductAttributesDto {
  @ApiProperty()
  upfrontPayment: number;

  @ApiProperty()
  leaseAmount: number;

  @ApiProperty()
  leaseTerm: number;

  @ApiProperty()
  monthlyLeasePayment: number;

  @ApiProperty()
  currentMonthlyAverageUtilityPayment: number;

  @ApiProperty()
  monthlyUtilityPayment: number;

  @ApiProperty()
  monthlyEnergyPayment: number;

  @ApiProperty()
  gridServicePayment: number;

  @ApiProperty()
  netCustomerEnergySpend: number;

  @ApiProperty()
  returnOnInvestment: number;

  @ApiProperty()
  payBackPeriod: number;
}
