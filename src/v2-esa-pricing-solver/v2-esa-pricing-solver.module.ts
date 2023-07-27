import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { FMV_APPRAISAL, FmvAppraisalSchema } from 'src/fmvAppraisal/fmvAppraisal.schema';
import { ManufacturerSchema, V2_MANUFACTURERS_COLL } from 'src/manufacturers/manufacturer.schema';
import { OPPORTUNITY, OpportunitySchema } from 'src/opportunities/opportunity.schema';
import { PROPERTY_COLLECTION_NAME } from 'src/property/constants';
import { PropertiesSchema } from 'src/property/property.schema';
import { QuoteModule } from 'src/quotes/quote.module';
import { UtilityMasterSchema, UTILITY_MASTER } from 'src/docusign-templates-master/schemas/utility-master.schema';
import { V2_ESA_PRICING_SOLVER_COLLECTION } from './constants';
import { EsaPricingSolverController } from './v2-esa-pricing-solver.controller';
import { V2EsaPricingSolverSchema } from './v2-esa-pricing-solver.schema';
import { EsaPricingSolverService } from './v2-esa-pricing-solver.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    FinancialProductsModule,
    forwardRef(() => QuoteModule),
    MongooseModule.forFeature([
      {
        name: V2_ESA_PRICING_SOLVER_COLLECTION,
        collection: V2_ESA_PRICING_SOLVER_COLLECTION,
        schema: V2EsaPricingSolverSchema,
      },
      {
        name: UTILITY_MASTER,
        collection: 'v2_utilities_master',
        schema: UtilityMasterSchema,
      },
      {
        name: V2_MANUFACTURERS_COLL,
        collection: V2_MANUFACTURERS_COLL,
        schema: ManufacturerSchema,
      },
      {
        name: OPPORTUNITY,
        collection: 'opportunities',
        schema: OpportunitySchema,
      },
      {
        name: PROPERTY_COLLECTION_NAME,
        collection: PROPERTY_COLLECTION_NAME,
        schema: PropertiesSchema,
      },
      {
        name: FMV_APPRAISAL,
        collection: 'fmvAppraisal',
        schema: FmvAppraisalSchema,
      },
    ]),
  ],
  controllers: [EsaPricingSolverController],
  providers: [EsaPricingSolverService],
  exports: [EsaPricingSolverService],
})
export class EsaPricingSolverModule {}
