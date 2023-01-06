import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from 'src/accounts/account.module';
import { AdderConfigModule } from 'src/adder-config/adder-config.module';
import { AuthencationModule } from 'src/authentication/authentication.module';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { ContactModule } from 'src/contacts/contact.module';
import { ContractModule } from 'src/contracts/contract.module';
import { CustomerPaymentModule } from 'src/customer-payments/customer-payment.module';
import { DiscountModule } from 'src/discounts/discount.module';
import { DocusignCommunicationModule } from 'src/docusign-communications/docusign-communication.module';
import { DocusignTemplateMasterModule } from 'src/docusign-templates-master/docusign-template-master.module';
import { ECommerceModule } from 'src/e-commerces/e-commerce.module';
import { ElectricVehicleModule } from 'src/electric-vehicles/electric-vehicle.module';
import { EmailTemplateModule } from 'src/email-templates/email-template.module';
import { EmailModule } from 'src/emails/email.module';
import { EnergyProfileModule } from 'src/energy-profiles/energy-profile.module';
import { ExistingSystemModule } from 'src/existing-systems/existing-system.module';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { GenabilityUtilityMapModule } from 'src/genability-utility-map/genability-utility-map.module';
import { GsProgramsModule } from 'src/gs-programs/gs-programs.module';
import { HealthcheckModule } from 'src/health-checks/health-check.module';
import { InstalledProductModule } from 'src/installed-products/installed-products.module';
import { LeaseSolverConfigModule } from 'src/lease-solver-configs/lease-solver-config.module';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { MountTypesModule } from 'src/mount-types-v2/mount-types-v2.module';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductionDeratesModule } from 'src/production-derates-v2/production-derates-v2.module';
import { ProductModuleV2 } from 'src/products-v2/product.module';
import { ProgressModule } from 'src/progresses/progress.module';
import { PromotionModule } from 'src/promotions/promotion.module';
import { ProposalSectionMasterModule } from 'src/proposal-section-masters/proposal-section-master.module';
import { ProposalTemplateModule } from 'src/proposal-templates/proposal-template.module';
import { ProposalModule } from 'src/proposals/proposal.module';
import { QualificationModule } from 'src/qualifications/qualification.module';
import { QuotePartnerConfigModule } from 'src/quote-partner-configs/quote-partner-config.module';
import { QuoteModule } from 'src/quotes/quote.module';
import { RebateProgramModule } from 'src/rebate-programs/rebate-programs.module';
import { AsyncContextModule } from 'src/shared/async-context';
import { AwsModule } from 'src/shared/aws/aws.module';
import { DocusignApiModule } from 'src/shared/docusign';
import { GoogleSunroofModule } from 'src/shared/google-sunroof/google-sunroof.module';
import { ENaming, MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';
import { MongooseNamingStrategyLoader } from 'src/shared/plugins/mongoose/naming-strategy.plugin';
import { SystemAttributeModule } from 'src/system-attributes/system-attribute.module';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { SystemProductionModule } from 'src/system-productions/system-production.module';
import { ToolTipModule } from 'src/tool-tips/tool-tip.module';
import { UsageProfileModule } from 'src/usage-profiles/usage-profile.module';
import { UserModule } from 'src/users/user.module';
import { UtilityModule } from 'src/utilities/utility.module';
import { UtilityProgramMasterModule } from 'src/utility-programs-master/utility-program-master.module';
import { MyLoggerModule } from './my-logger/my-logger.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AsyncContextModule,
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://localhost:27017', { useFindAndModify: false }),
    MongooseNamingStrategyLoader.forRoot(
      new MongooseNamingStrategy({ autoload: true, schemaType: ENaming.SNAKE_CASE, logger: true })
        .useLeanSignature(false)
        .setAuloload(true)
        .addExclusions('sizeW', 'sizekWh', 'capacityKW', 'generationKWh')
        .addCustomMapping('currentPricePerKWh', 'current_price_per_kWh')
        .addCustomMapping('newPricePerKWh', 'new_price_per_kWh')
        .addCustomMapping('ratePerKWh', 'rate_per_kWh')
        .addCustomMapping('annualUsageKWh', 'annual_usageKWh')
        .addCustomMapping('annual_usageKWh', 'annualUsageKWh')
        .addCustomMapping('laborCostPerWatt', 'labor_cost_perWatt')
        .addCustomMapping('systemCapacityKW', 'system_capacity_kW')
        .addCustomMapping('array_generationKWh', 'arrayGenerationKWh')
        .addCustomMapping('arrayGenerationKWh', 'array_generationKWh')
        .addCustomMapping('generationMonthlyKWh', 'generation_monthlyKWh')
        .addCustomMapping('existing_pv_azimuth', 'existingPVAzimuth')
        .addCustomMapping('existingPVAzimuth', 'existing_pv_azimuth')
        .addCustomMapping('existing_pv_pitch', 'existingPVPitch')
        .addCustomMapping('existingPVPitch', 'existing_pv_pitch')
        .addCustomMapping('existingPVSize', 'existing_pv_size')
        .addCustomMapping('existing_pv_size', 'existingPVSize')
        .addCustomMapping('kwh_per_100_miles', 'kwhPer100Miles')
        .addCustomMapping('kwhPer100Miles', 'kwh_per_100_miles'),
    ),
    AwsModule,
    GoogleSunroofModule,
    AccountModule,
    AdderConfigModule,
    AuthencationModule,
    CashPaymentConfigModule,
    ContactModule,
    ContractModule,
    CustomerPaymentModule,
    DocusignCommunicationModule,
    DocusignTemplateMasterModule,
    ECommerceModule,
    EmailModule,
    EmailTemplateModule,
    ExternalServiceModule,
    FundingSourceModule,
    LeaseSolverConfigModule,
    ManufacturerModule,
    MyLoggerModule,
    OpportunityModule,
    ProgressModule,
    ProposalModule,
    ProposalSectionMasterModule,
    ProposalTemplateModule,
    QualificationModule,
    QuoteModule,
    QuotePartnerConfigModule,
    RebateProgramModule,
    SystemDesignModule,
    SystemProductionModule,
    UserModule,
    UtilityModule,
    UtilityProgramMasterModule,
    GsProgramsModule,
    FinancialProductsModule,
    ProductModuleV2,
    InstalledProductModule,
    HealthcheckModule,
    DocusignApiModule,
    DiscountModule,
    PromotionModule,
    GenabilityUtilityMapModule,
    SystemAttributeModule,
    UsageProfileModule,
    ElectricVehicleModule,
    EnergyProfileModule,
    ExistingSystemModule,
    ProductionDeratesModule,
    ToolTipModule,
    MountTypesModule,
  ],
})
export class AppModule {}
