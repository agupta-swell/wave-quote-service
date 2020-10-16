import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuoteController } from './quote.controller';
import { QUOTE, QuoteSchema } from './quote.schema';
import { QuoteService } from './quote.service';
import { CashPaymentConfigSchema, CASH_PAYMENT_CONFIG } from './schemas/cash-payment-config.schema';
import { LaborCostConfigSchema, LABOR_COST_CONFIG } from './schemas/labor-cost-config.schema';
import { TAX_CREDIT_CONFIG, TaxCreditConfigSchema } from './schemas/tax-credit-config.schema';
import { CalculationService } from './sub-services';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QUOTE, schema: QuoteSchema, collection: 'v2_quotes' },
      {
        name: LABOR_COST_CONFIG,
        schema: LaborCostConfigSchema,
        collection: 'labor_cost_config',
      },
      {
        name: CASH_PAYMENT_CONFIG,
        schema: CashPaymentConfigSchema,
        collection: 'cash_payment_config',
      },
      {
        name: TAX_CREDIT_CONFIG,
        schema: TaxCreditConfigSchema,
        collection: 'tax_credit_config',
      },
    ]),
  ],
  controllers: [QuoteController],
  providers: [QuoteService, CalculationService],
  exports: [QuoteService],
})
export class QuoteModule {}
