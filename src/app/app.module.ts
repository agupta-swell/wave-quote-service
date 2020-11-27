import { ContactModule } from './../contacts/contact.module';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthencationModule } from 'src/authentication/authentication.module';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { ProposalModule } from 'src/proposals/proposal.module';
import { RoleModule } from 'src/roles/role.module';
import { UserModule } from 'src/users/user.module';
import { UtilityProgramModule } from 'src/utility-programs/utility-program.module';
import { EmailModule } from '../emails/email.module';
import { LeaseSolverConfigModule } from '../lease-solver-configs/lease-solver-config.module';
import { ProposalSectionMasterModule } from '../proposal-section-masters/proposal-section-masters.module';
import { ProposalTemplateModule } from '../proposal-templates/proposal-template.module';
import { SystemDesignModule } from '../system-designs/system-design.module';
import { UtilityModule } from '../utilities/utility.module';
import { AdderConfigModule } from './../adder-config/adder-config.module';
import { ExternalServiceModule } from './../external-services/external-service.module';
import { OpportunityModule } from './../opportunities/opportunity.module';
import { ProductModule } from './../products/product.module';
import { ProgressModule } from './../progresses/progress.module';
import { QualificationModule } from './../qualifications/qualification.module';
import { QuoteModule } from './../quotes/quote.module';
import { MyLoggerModule } from './my-logger/my-logger.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
    MyLoggerModule,
    UserModule,
    RoleModule,
    AuthencationModule,
    SystemDesignModule,
    ProductModule,
    ExternalServiceModule,
    UtilityModule,
    AdderConfigModule,
    QuoteModule,
    UtilityProgramModule,
    FundingSourceModule,
    CashPaymentConfigModule,
    LeaseSolverConfigModule,
    ProgressModule,
    ProposalSectionMasterModule,
    ProposalTemplateModule,
    ProposalModule,
    QualificationModule,
    EmailModule,
    OpportunityModule,
    ContactModule,
  ],
})
export class AppModule {
  constructor() {}
}
