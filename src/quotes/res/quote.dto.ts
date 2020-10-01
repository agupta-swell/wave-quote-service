import { ApiProperty } from '@nestjs/swagger';
import { RoofTopDataDto } from 'src/system-designs/res/sub-dto';
import { SystemProductionDto } from 'src/system-designs/res/system-design.dto';
import { toCamelCase } from 'src/utils/transformProperties';
import { Quote } from './../quote.schema';
import { CalculatedQuoteDetailDto, QuoteFinanceProductDto } from './sub-dto';

class DetailedQuote {
  @ApiProperty({ type: () => RoofTopDataDto })
  solarDesign: RoofTopDataDto;

  @ApiProperty({ type: () => SystemProductionDto })
  systemProduction: SystemProductionDto;

  //FIXME: need to implement later
  @ApiProperty()
  utilityProgram: any;

  @ApiProperty({ type: () => QuoteFinanceProductDto })
  quoteFinanceProduct: QuoteFinanceProductDto;

  @ApiProperty({ type: () => CalculatedQuoteDetailDto })
  calculatedQuoteDetails: CalculatedQuoteDetailDto;
}

export class QuoteDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  systemDesignId: string;

  @ApiProperty()
  quoteModelType: string;

  @ApiProperty({ type: DetailedQuote })
  detailedQuote: DetailedQuote;

  constructor(props: Quote) {
    this.opportunityId = props.opportunity_id;
    this.systemDesignId = props.system_design_id;
    this.quoteModelType = props.quote_model_type;
    this.detailedQuote = this.transformDetailedQuote(props);
  }

  transformDetailedQuote(props: Quote): DetailedQuote {
    const {
      detailed_quote: {
        system_production,
        utility_program,
        quote_finance_product: { incentive_details, rebate_details, finace_product },
      },
    } = props;
    return {
      systemProduction: toCamelCase(system_production),
      utilityProgram: utility_program,
      quoteFinanceProduct: {
        incentiveDetails: incentive_details.map(item => toCamelCase(item)),
        rebateDetails: rebate_details.map(item => toCamelCase(item)),
        finaceProduct: toCamelCase(finace_product),
      },
    } as any;
  }
}
