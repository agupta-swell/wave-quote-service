import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { SavingsCalculatorModule } from 'src/savings-calculator/saving-calculator.module';
import { DiscountModule } from 'src/discounts/discount.module';
import { PromotionModule } from 'src/promotions/promotion.module';
import { TaxCreditConfigModule } from 'src/tax-credit-configs/tax-credit-config.module';
import { QuoteController } from './quote.controller';
import { QUOTE, QuoteSchema } from './quote.schema';
import { QuoteService } from './quote.service';
import { ITCSchema, I_T_C } from './schemas';
import { CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService } from './sub-services';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: QUOTE, schema: QuoteSchema, collection: 'v2_quotes' },
      { name: I_T_C, schema: ITCSchema, collection: 'v2_itc' },
    ]),
    FinancialProductsModule,
    SavingsCalculatorModule,
    ManufacturerModule,
    DiscountModule,
    PromotionModule,
    TaxCreditConfigModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService],
  exports: [QuoteService, CalculationService],
})
export class QuoteModule {}
