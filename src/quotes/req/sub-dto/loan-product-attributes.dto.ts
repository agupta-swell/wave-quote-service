import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { ILoanTerms } from 'src/financial-products/financial-product.schema';

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
export class LoanTermsDto implements ILoanTerms {
  @ApiProperty()
  @IsNumber()
  months: number;

  @ApiProperty()
  @IsNumber()
  paymentFactor: number;
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

  @ApiProperty({ type: LoanTermsDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => LoanTermsDto)
  terms: LoanTermsDto[];

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

  @ApiProperty()
  @IsNumber()
  dealerFee: number;
}
