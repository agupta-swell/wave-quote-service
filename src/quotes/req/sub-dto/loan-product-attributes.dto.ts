import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

class ReinvestmentDto {
  @ApiProperty()
  @IsNumber()
  reinvestmentAmount: number;

  @ApiProperty()
  @IsNumber()
  reinvestmentMonth: number; // default: 18

  @ApiProperty()
  @IsString()
  description: string;
}

export class LoanProductAttributesDto {
  @ApiProperty()
  @IsNumber()
  upfrontPayment: number;

  @ApiProperty()
  @IsNumber()
  loanAmount: number;

  @ApiProperty()
  loanStartDate: number;

  @ApiProperty()
  @IsNumber()
  interestRate: number;

  @ApiProperty()
  @IsNumber()
  loanTerm: number;

  @ApiProperty({ type: ReinvestmentDto })
  reinvestment: ReinvestmentDto;

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
