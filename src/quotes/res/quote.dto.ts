import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { SystemProductionDto } from 'src/system-designs/res/system-design.dto';
import { toCamelCase } from 'src/utils/transformProperties';
import { Pagination, ServiceResponse } from '../../app/common';
import { IQuoteCostBuildupSchema, IQuoteFinanceProductSchema, ISavingsDetailsSchema, Quote } from '../quote.schema';
import { NotesDto, QuoteCostBuildupDto, QuoteFinanceProductDto } from './sub-dto';

class UtilityProgramDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  rebateAmount: number;
}

class SavingsDetailDto {
  @ApiProperty()
  year: number;

  @ApiProperty()
  currentUtilityBill: number;

  @ApiProperty()
  newUtilityBill: number;

  @ApiProperty()
  payment: number;

  @ApiProperty()
  discountAndIncentives: number;

  @ApiProperty()
  annualSaving: number;
}

class TaxCreditConfigSnapshot {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  taxCreditPrecentage: number;

  @ApiProperty()
  taxCreditStartDate: Date;

  @ApiProperty()
  taxCreditEndDate: Date;
}

class TaxCreditDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty({ type: TaxCreditConfigSnapshot })
  taxCreditConfigDataSnapshot: TaxCreditConfigSnapshot;

  @ApiProperty()
  taxCreditConfigDataSnapshotDate: Date;
}

class QuotePricePerWatt {
  @ApiProperty()
  pricePerWatt: number;

  @ApiProperty()
  grossPrice: number;
}

class QuotePriceOverride {
  @ApiProperty()
  grossPrice: number;
}

export class QuoteDto {
  @ApiProperty()
  quoteId: string;

  @ApiProperty()
  quoteName: string;

  @ApiProperty()
  isRetrofit: boolean;

  @ApiProperty()
  isSolar: boolean;

  @ApiProperty()
  isSelected: boolean;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  systemDesignId: string;

  @ApiProperty({ type: () => SystemProductionDto })
  systemProduction: SystemProductionDto;

  @ApiProperty({ type: () => QuoteCostBuildupDto })
  quoteCostBuildup: QuoteCostBuildupDto;

  @ApiProperty({ type: () => UtilityProgramDto })
  utilityProgram: UtilityProgramDto;

  @ApiProperty({ type: () => QuoteFinanceProductDto })
  quoteFinanceProduct: QuoteFinanceProductDto;

  @ApiProperty({ type: () => SavingsDetailDto, isArray: true })
  savingsDetails: SavingsDetailDto[];

  @ApiProperty()
  isSync: boolean;

  @ApiProperty()
  isSyncMessages: string[];

  @ApiProperty({ type: TaxCreditDto, isArray: true })
  taxCreditData: TaxCreditDto[];

  @ApiProperty()
  utilityProgramSelectedForReinvestment: boolean;

  @ApiProperty()
  taxCreditSelectedForReinvestment: boolean;

  @ApiProperty({ type: String, isArray: true })
  allowedQuoteModes: string[];

  @ApiProperty()
  selectedQuoteMode: string;

  @ApiProperty({ type: QuotePricePerWatt })
  quotePricePerWatt: QuotePricePerWatt;

  @ApiProperty({ type: QuotePriceOverride })
  quotePriceOverride: QuotePriceOverride;

  @ApiProperty({ type: NotesDto, isArray: true })
  notes: NotesDto[];

  constructor(props: LeanDocument<Quote>) {
    this.quoteId = props._id;
    this.quoteName = props.detailed_quote.quote_name;
    this.opportunityId = props.opportunity_id;
    this.systemDesignId = props.system_design_id;
    this.isSelected = props.detailed_quote.is_selected;
    this.isRetrofit = props.detailed_quote.is_retrofit;
    this.isSolar = props.detailed_quote.is_solar;
    this.systemProduction = toCamelCase(props.detailed_quote.system_production);
    this.utilityProgram = props.detailed_quote.utility_program && toCamelCase(props.detailed_quote.utility_program);
    this.quoteFinanceProduct = this.transformQuoteFinanceProduct(props.detailed_quote.quote_finance_product);
    this.savingsDetails = this.transformSavingsDetails(props.detailed_quote.savings_details);
    this.quoteCostBuildup = this.transformQuoteCostBuildup(props.detailed_quote.quote_cost_buildup);
    this.taxCreditData = props.detailed_quote.tax_credit_data.map(item => toCamelCase(item));
    this.utilityProgramSelectedForReinvestment = props.detailed_quote.utility_program_selected_for_reinvestment;
    this.taxCreditSelectedForReinvestment = props.detailed_quote.tax_credit_selected_for_reinvestment;
    this.isSync = props.is_sync;
    this.isSyncMessages = props.is_sync_messages;
    this.allowedQuoteModes = props.detailed_quote.allowed_quote_modes;
    this.selectedQuoteMode = props.detailed_quote.selected_quote_mode;
    this.quotePricePerWatt = toCamelCase(props.detailed_quote.quote_price_per_watt);
    this.quotePriceOverride = toCamelCase(props.detailed_quote.quote_price_override);
    this.notes = (props.detailed_quote.notes ?? []).map(item => toCamelCase(item));
  }

  transformQuoteCostBuildup(quoteCostBuildup: IQuoteCostBuildupSchema): QuoteCostBuildupDto {
    return {
      panelQuoteDetails: quoteCostBuildup.panel_quote_details.map(item => toCamelCase(item)),
      inverterQuoteDetails: quoteCostBuildup.inverter_quote_details.map(item => toCamelCase(item)),
      storageQuoteDetails: quoteCostBuildup.storage_quote_details.map(item => toCamelCase(item)),
      adderQuoteDetails: quoteCostBuildup.adder_quote_details.map(item => toCamelCase(item)),
      balanceOfSystemDetails: quoteCostBuildup.balance_of_system_details.map(item => toCamelCase(item)),
      ancillaryEquipmentDetails: quoteCostBuildup.ancillary_equipment_details.map(item => toCamelCase(item)),
      swellStandardMarkup: quoteCostBuildup.swell_standard_markup,
      laborCost: toCamelCase(quoteCostBuildup.labor_cost),
      grossPrice: quoteCostBuildup.gross_price,
      totalNetCost: quoteCostBuildup.total_net_cost,
    };
  }

  transformQuoteFinanceProduct(quoteFinanceProduct: IQuoteFinanceProductSchema): QuoteFinanceProductDto {
    return {
      financeProduct: toCamelCase(quoteFinanceProduct.finance_product),
      netAmount: quoteFinanceProduct.net_amount,
      incentiveDetails: quoteFinanceProduct.incentive_details,
      rebateDetails: quoteFinanceProduct.rebate_details.map(item => toCamelCase(item)),
      projectDiscountDetails: quoteFinanceProduct.project_discount_details.map(item => toCamelCase(item)),
    };
  }

  transformSavingsDetails(savingsDetails: ISavingsDetailsSchema[]): SavingsDetailDto[] {
    return savingsDetails.map(item => toCamelCase(item));
  }
}

class PaginationRes implements Pagination<QuoteDto> {
  @ApiProperty({
    type: QuoteDto,
    isArray: true,
  })
  data: QuoteDto[];

  @ApiProperty()
  total: number;
}

export class QuoteListRes implements ServiceResponse<PaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: PaginationRes })
  data: PaginationRes;
}

export class QuoteRes implements ServiceResponse<QuoteDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: QuoteDto })
  data: QuoteDto;
}
