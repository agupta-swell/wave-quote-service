import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuoteController } from './quote.controller';
import { QUOTE, QuoteSchema } from './quote.schema';
import { QuoteService } from './quote.service';
import { TaxCreditConfigSchema, TAX_CREDIT_CONFIG } from './schemas/tax-credit-config.schema';
import { CalculationService } from './sub-services';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QUOTE, schema: QuoteSchema, collection: 'v2_quotes' },
      // {
      //   name: LABOR_COST_CONFIG,
      //   schema: LaborCostConfigSchema,
      //   collection: 'v2_labor_cost_configs',
      // },
      {
        name: TAX_CREDIT_CONFIG,
        schema: TaxCreditConfigSchema,
        collection: 'v2_tax_credit_configs',
      },
    ]),
  ],
  controllers: [QuoteController],
  providers: [QuoteService, CalculationService],
  exports: [QuoteService],
})
export class QuoteModule {}
