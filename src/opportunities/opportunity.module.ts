import { forwardRef, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from 'src/accounts/account.module';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ExistingSystemModule } from 'src/existing-systems/existing-system.module';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { FinancierModule } from 'src/financiers/financier.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { PropertyModule } from 'src/property/property.module';
import { QuotePartnerConfigModule } from 'src/quote-partner-configs/quote-partner-config.module';
import { QuoteModule } from 'src/quotes/quote.module';
import { OpportunityController } from './opportunity.controller';
import { OPPORTUNITY, OpportunitySchema } from './opportunity.schema';
import { OpportunityService } from './opportunity.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: OPPORTUNITY,
        schema: OpportunitySchema,
        collection: 'opportunities',
      },
    ]),
    AccountModule,
    FinancialProductsModule,
    FundingSourceModule,
    FinancierModule,
    QuotePartnerConfigModule,
    QuoteModule,
    forwardRef(() => ExistingSystemModule),
    PropertyModule,
  ],
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
