import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { DiscountModule } from 'src/discounts/discount.module';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { GsProgramsModule } from 'src/gs-programs/gs-programs.module';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { PromotionModule } from 'src/promotions/promotion.module';
import { SavingsCalculatorModule } from 'src/savings-calculator/saving-calculator.module';
import { SystemProductionModule } from 'src/system-production/system-production.module';
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
    GsProgramsModule,
    SystemProductionModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService],
  exports: [QuoteService, CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService],
})
export class QuoteModule {}
