import { forwardRef, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { DiscountModule } from 'src/discounts/discount.module';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { FmvAppraisalModule } from 'src/fmvAppraisal/fmvAppraisal.module';
import { FmvAppraisalSchema, FMV_APPRAISAL } from 'src/fmvAppraisal/fmvAppraisal.schema';
import { GsProgramsModule } from 'src/gs-programs/gs-programs.module';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { PromotionModule } from 'src/promotions/promotion.module';
import { PROPERTY_COLLECTION_NAME } from 'src/property/constants';
import { PropertyModule } from 'src/property/property.module';
import { PropertiesSchema } from 'src/property/property.schema';
import { SystemProductionModule } from 'src/system-productions/system-production.module';
import { TaxCreditConfigModule } from 'src/tax-credit-configs/tax-credit-config.module';
import { UtilitiesMasterModule } from 'src/utilities-master/utilities-master.module';
import { UtilitiesMasterSchema, UTILITIES_MASTER } from 'src/utilities-master/utilities-master.schema';
import { EsaPricingSolverModule } from 'src/v2-esa-pricing-solver/v2-esa-pricing-solver.module';
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
    forwardRef(() => EsaPricingSolverModule),
    MongooseModule.forFeature([
      { name: QUOTE, schema: QuoteSchema, collection: 'v2_quotes' },
      { name: I_T_C, schema: ITCSchema, collection: 'v2_itc' },
      { name: FMV_APPRAISAL, schema: FmvAppraisalSchema, collection: 'fmvAppraisal' },
      { name: PROPERTY_COLLECTION_NAME, collection: PROPERTY_COLLECTION_NAME, schema: PropertiesSchema },
      {
        name: UTILITIES_MASTER,
        collection: 'v2_utilities_master',
        schema: UtilitiesMasterSchema,
      },
    ]),
    FinancialProductsModule,
    ManufacturerModule,
    DiscountModule,
    PromotionModule,
    TaxCreditConfigModule,
    GsProgramsModule,
    SystemProductionModule,
    FmvAppraisalModule,
    UtilitiesMasterModule,
    PropertyModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService],
  exports: [QuoteService, CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService],
})
export class QuoteModule {}
