import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { SavingsCalculatorModule } from 'src/savings-calculator/saving-calculator.module';
import { QuoteController } from './quote.controller';
import { QUOTE, QuoteSchema } from './quote.schema';
import { QuoteService } from './quote.service';
import {
  ITCSchema,
  I_T_C,
  QuoteMarkupConfigSchema,
  QUOTE_MARKUP_CONFIG,
  TaxCreditConfigSchema,
  TAX_CREDIT_CONFIG,
  DISCOUNTS,
  DiscountsSchema,
} from './schemas';
import { CalculationService, QuoteMarkupConfigService } from './sub-services';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: QUOTE, schema: QuoteSchema, collection: 'v2_quotes' },
      { name: QUOTE_MARKUP_CONFIG, schema: QuoteMarkupConfigSchema, collection: 'v2_quote_markup_config' },
      {
        name: TAX_CREDIT_CONFIG,
        schema: TaxCreditConfigSchema,
        collection: 'v2_tax_credit_configs',
      },
      { name: I_T_C, schema: ITCSchema, collection: 'v2_itc' },
      {
        name: DISCOUNTS,
        schema: DiscountsSchema,
        collection: 'v2_discounts',
      },
    ]),
    FinancialProductsModule,
    SavingsCalculatorModule,
    ManufacturerModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, CalculationService, QuoteMarkupConfigService],
  exports: [QuoteService, CalculationService],
})
export class QuoteModule {}
