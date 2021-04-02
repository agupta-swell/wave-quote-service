import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { FinancialProduct, FinancialProductSchema } from '../financial-product.schema';

export class FinancialProductDto {
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

  @ApiProperty()
  allowedStates: string[];

  @ApiProperty()
  interestRate: number;

  @ApiProperty()
  termMonths: number;

  @ApiProperty()
  dealerFee: number;

  constructor(props: LeanDocument<FinancialProduct>) {
    this.id = props._id;
    this.fundingSourceId = props.funding_source_id;
    this.name = props.name;
    this.fundId = props.fund_id;
    this.allowDownPayment = props.allow_down_payment;
    this.minDownPayment = props.min_down_payment;
    this.defaultDownPayment = props.default_down_payment;
    this.maxDownPayment = props.max_down_payment;
    this.annualDegradation = props.annual_degradation;
    this.guaranteedProduction = props.guaranteed_production;
    this.minMargin = props.min_margin;
    this.maxMargin = props.max_margin;
    this.minSystemKw = props.min_system_kw;
    this.maxSystemKw = props.max_system_kw;
    this.minBatteryKwh = props.min_battery_kwh;
    this.maxBatteryKwh = props.max_battery_kwh;
    this.minProductivity = props.min_productivity;
    this.maxProductivity = props.max_productivity;
    this.allowedStates = props.allowed_states;
    this.interestRate = props.interest_rate;
    this.termMonths = props.term_months;
    this.dealerFee = props.dealer_fee;
  }
}

class FinancialProductPaginationDto implements Pagination<FinancialProductDto> {
  @ApiProperty({
    type: FinancialProductDto,
    isArray: true,
  })
  data: FinancialProductDto[];

  @ApiProperty()
  total: number;
}

export class FinancialProductPaginationRes implements ServiceResponse<FinancialProductPaginationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: FinancialProductPaginationDto })
  data: FinancialProductPaginationDto;
}
