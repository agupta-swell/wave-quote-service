import { ApiProperty } from '@nestjs/swagger';

export class FinanceProductDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fundingSourceId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  name: string;

  @ApiProperty()
  fundId: string;

  @ApiProperty()
  allowDownPayment: boolean;

  @ApiProperty()
  minDownPayment: number;

  @ApiProperty()
  defaultDownPayment: number;

  @ApiProperty()
  maxDownPayment: number;

  @ApiProperty()
  annualDegradation: number;

  @ApiProperty()
  guaranteedProduction: number;

  @ApiProperty()
  minMargin: number;

  @ApiProperty()
  maxMargin: number;

  @ApiProperty()
  minSystemKw: number;

  @ApiProperty()
  maxSystemKw: number;

  @ApiProperty()
  minBatteryKwh: number;

  @ApiProperty()
  maxBatteryKwh: number;

  @ApiProperty()
  minProductivity: number;

  @ApiProperty()
  maxProductivity: number;

  @ApiProperty({ type: String, isArray: true })
  allowedStates: string[];

  @ApiProperty()
  interestRate: number;

  @ApiProperty()
  termMonths: number;

  @ApiProperty()
  dealerFee: number;
}
