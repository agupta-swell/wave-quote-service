import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class FinanceProductDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fundingSourceId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  fundId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  allowDownPayment: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  minDownPayment: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  defaultDownPayment: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  maxDownPayment: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  maxDownPaymentPercentage: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  annualDegradation: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  guaranteedProduction: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  minMargin: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  maxMargin: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  minSystemKw: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  maxSystemKw: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  minBatteryKwh: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  maxBatteryKwh: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  minProductivity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  maxProductivity: number;

  @ApiProperty({ type: String, isArray: true })
  @IsNotEmpty()
  @IsArray()
  allowedStates: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  interestRate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  termMonths: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  dealerFee: number;

  @ApiProperty()
  minBatteryReserve: number;

  @ApiProperty()
  maxBatteryReserve: number;

  @ApiProperty()
  minClippingRatio: number;

  @ApiProperty()
  maxClippingRatio: number;

  @ApiProperty()
  minMarkup: number;

  @ApiProperty()
  maxMarkup: number;

  @ApiProperty()
  requiresHardCreditApproval: boolean;

  @ApiProperty()
  countersignerName: string;

  @ApiProperty()
  countersignerTitle: string;

  @ApiProperty()
  countersignerEmail: string;

  @ApiProperty()
  financierId: string;

  @ApiProperty()
  allowsWetSignedContracts: boolean;

  @ApiProperty()
  projectCompletionDateOffset: number;

  @ApiProperty()
  processingFee: number;
}
