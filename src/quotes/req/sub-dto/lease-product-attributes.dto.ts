import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class LeaseProductAttributesDto {
  @ApiProperty()
  @IsNumber()
  upfrontPayment: number;

  @ApiProperty()
  @IsNumber()
  leaseAmount: number;

  @ApiProperty()
  @IsNumber()
  rateEscalator: number;

  @ApiProperty()
  @IsNumber()
  ratePerkWh: number;

  @ApiProperty()
  @IsNumber()
  leaseTerm: number;

  @ApiProperty()
  @IsNumber()
  monthlyLeasePayment: number;

  @ApiProperty()
  @IsNumber()
  currentMonthlyAverageUtilityPayment: number;

  @ApiProperty()
  @IsNumber()
  monthlyUtilityPayment: number;

  @ApiProperty()
  @IsNumber()
  monthlyEnergyPayment: number;

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

  @ApiProperty()
  @IsNumber()
  currentPricePerKwh: number;

  @ApiProperty()
  @IsNumber()
  newPricePerKwh: number;

  @ApiProperty()
  yearlyLoanPaymentDetails: any;
}
