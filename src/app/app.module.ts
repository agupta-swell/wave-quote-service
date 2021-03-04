import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdderConfigModule } from 'src/adder-config/adder-config.module';
import { AuthencationModule } from 'src/authentication/authentication.module';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { ContactModule } from 'src/contacts/contact.module';
import { ContractModule } from 'src/contracts/contract.module';
import { CustomerPaymentModule } from 'src/customer-payments/customer-payment.module';
import { DocusignCommunicationModule } from 'src/docusign-communications/docusign-communication.module';
import { DocusignTemplateMasterModule } from 'src/docusign-templates-master/docusign-template-master.module';
import { ECommerceModule } from 'src/e-commerces/e-commerce.module';
import { EmailModule } from 'src/emails/email.module';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { LeaseSolverConfigModule } from 'src/lease-solver-configs/lease-solver-config.module';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductModule } from 'src/products/product.module';
import { ProgressModule } from 'src/progresses/progress.module';
import { ProposalSectionMasterModule } from 'src/proposal-section-masters/proposal-section-master.module';
import { ProposalTemplateModule } from 'src/proposal-templates/proposal-template.module';
import { ProposalModule } from 'src/proposals/proposal.module';
import { QualificationModule } from 'src/qualifications/qualification.module';
import { QuotePartnerConfigModule } from 'src/quote-partner-configs/quote-partner-config.module';
import { QuoteModule } from 'src/quotes/quote.module';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { UserModule } from 'src/users/user.module';
import { UtilityModule } from 'src/utilities/utility.module';
import { UtilityProgramMasterModule } from 'src/utility-programs-master/utility-program-master.module';
import { MyLoggerModule } from './my-logger/my-logger.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://locahost:27017', { useFindAndModify: false }),
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
    ExternalServiceModule,
    FundingSourceModule,
    LeaseSolverConfigModule,
    ManufacturerModule,
    MyLoggerModule,
    OpportunityModule,
    ProductModule,
    ProgressModule,
    ProposalModule,
    ProposalSectionMasterModule,
    ProposalTemplateModule,
    QualificationModule,
    QuoteModule,
    QuotePartnerConfigModule,
    SystemDesignModule,
    UserModule,
    UtilityModule,
    UtilityProgramMasterModule,
  ],
})
export class AppModule {
  constructor() {}
}
