import { ApiProperty } from '@nestjs/swagger';
import { SystemProductionDto } from 'src/system-designs/res/system-design.dto';
import { toCamelCase } from 'src/utils/transformProperties';
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

export class QuoteDto {
  @ApiProperty()
  id: string;

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

  constructor(props: Quote) {
    this.id = props._id;
    this.opportunityId = props.opportunity_id;
    this.systemDesignId = props.system_design_id;
    this.systemProduction = toCamelCase(props.detailed_quote.system_production);
    this.utilityProgram = toCamelCase(props.detailed_quote.utility_program);
    this.quoteFinanceProduct = this.transformQuoteFinanceProduct(props.detailed_quote.quote_finance_product);
    this.savingsDetails = this.transformSavingsDetails(props.detailed_quote.savings_details);
    this.quoteCostBuildup = this.transformQuoteCostBuildup(props.detailed_quote.quote_cost_buildup);
  }

  transformQuoteCostBuildup(quoteCostBuildup: IQuoteCostBuildupSchema): QuoteCostBuildupDto {
    return {
      panelQuoteDetails: quoteCostBuildup.panel_quote_details.map(item => toCamelCase(item)),
      inveterQuoteDetails: quoteCostBuildup.inverter_quote_details.map(item => toCamelCase(item)),
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
      finaceProduct: toCamelCase(quoteFinanceProduct.finance_product),
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
