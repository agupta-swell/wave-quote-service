import { TaxCreditConfig } from './../schemas/tax-credit-config.schema';
import { ApiProperty } from '@nestjs/swagger';
import { SystemProductionDto } from 'src/system-designs/res/system-design.dto';
import { toCamelCase } from 'src/utils/transformProperties';
import { Pagination, ServiceResponse } from '../../app/common';
import { IQuoteCostBuildupSchema, IQuoteFinanceProductSchema, ISavingsDetailsSchema, Quote } from './../quote.schema';
import { QuoteCostBuildupDto, QuoteFinanceProductDto } from './sub-dto';

class UtilityProgramDto {
  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  utilityProgramName: string;
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

export class QuoteDto {
  @ApiProperty()
  quoteId: string;

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

  @ApiProperty({ type: TaxCreditDto, isArray: true })
  taxCreditData: TaxCreditDto[];

  @ApiProperty()
  utilityProgramSelectedForReinvestment: boolean;

  @ApiProperty()
  taxCreditSelectedForReinvestment: boolean;

  constructor(props: Quote) {
    this.quoteId = props._id;
    this.opportunityId = props.opportunity_id;
    this.systemDesignId = props.system_design_id;
    this.isSelected = props.detailed_quote.is_selected;
    this.isRetrofit = props.detailed_quote.is_retrofit;
    this.isSolar = props.detailed_quote.is_solar;
    this.systemProduction = toCamelCase(props.detailed_quote.system_production);
    this.utilityProgram = toCamelCase(props.detailed_quote.utility_program);
    this.quoteFinanceProduct = this.transformQuoteFinanceProduct(props.detailed_quote.quote_finance_product);
    this.savingsDetails = this.transformSavingsDetails(props.detailed_quote.savings_details);
    this.quoteCostBuildup = this.transformQuoteCostBuildup(props.detailed_quote.quote_cost_buildup);
    this.taxCreditData = props.detailed_quote.tax_credit_data.map(item => toCamelCase(item));
    this.utilityProgramSelectedForReinvestment = props.detailed_quote.utility_program_selected_for_reinvestment;
    this.taxCreditSelectedForReinvestment = props.detailed_quote.tax_credit_selected_for_reinvestment;
    this.isSync = props.is_sync;
  }

  transformQuoteCostBuildup(quoteCostBuildup: IQuoteCostBuildupSchema): QuoteCostBuildupDto {
    return {
      panelQuoteDetails: quoteCostBuildup.panel_quote_details.map(item => toCamelCase(item)),
      inverterQuoteDetails: quoteCostBuildup.inverter_quote_details.map(item => toCamelCase(item)),
      storageQuoteDetails: quoteCostBuildup.storage_quote_details.map(item => toCamelCase(item)),
      adderQuoteDetails: quoteCostBuildup.adder_quote_details.map(item => toCamelCase(item)),
      overallMarkup: quoteCostBuildup.overall_markup,
      totalProductCost: quoteCostBuildup.total_product_cost,
      laborCost: toCamelCase(quoteCostBuildup.labor_cost),
      grossAmount: quoteCostBuildup.gross_amount,
    };
  }

  transformQuoteFinanceProduct(quoteFinanceProduct: IQuoteFinanceProductSchema): QuoteFinanceProductDto {
    return {
      financeProduct: toCamelCase(quoteFinanceProduct.finance_product),
      netAmount: quoteFinanceProduct.net_amount,
      incentiveDetails: quoteFinanceProduct.incentive_details.map(item => toCamelCase(item)),
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
