import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountPhotoModule } from 'src/account-photos/account-photo.module';
import { AccountModule } from 'src/accounts/account.module';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { EnergyProfileModule } from 'src/energy-profiles/energy-profile.module';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { GsProgramsModule } from 'src/gs-programs/gs-programs.module';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { PropertyModule } from 'src/property/property.module';
import { AwsModule } from 'src/shared/aws/aws.module';
import { DocusignApiModule } from 'src/shared/docusign';
import { SystemProductionModule } from 'src/system-productions/system-production.module';
import { ProposalController } from './proposal.controller';
import { PROPOSAL, ProposalSchema } from './proposal.schema';
import { ProposalService } from './proposal.service';
import { ProposalAnalyticSchema, PROPOSAL_ANALYTIC } from './schemas/proposal-analytic.schema';

@Global()
@Module({
  imports: [
    DocusignApiModule,
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: PROPOSAL,
        schema: ProposalSchema,
        collection: 'v2_proposals',
      },
      {
        name: PROPOSAL_ANALYTIC,
        schema: ProposalAnalyticSchema,
        collection: 'v2_proposal_analytics',
      },
    ]),
    GsProgramsModule,
    AwsModule,
    FinancialProductsModule,
    ManufacturerModule,
    DocusignApiModule.forContext(),
    SystemProductionModule,
    EnergyProfileModule,
    PropertyModule,
    AccountPhotoModule,
    AccountModule,
  ],
  controllers: [ProposalController],
  providers: [ProposalService],
  exports: [ProposalService],
})
export class ProposalModule {}
