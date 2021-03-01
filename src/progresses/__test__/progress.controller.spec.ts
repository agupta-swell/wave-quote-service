import { JwtModule } from '@nestjs/jwt';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AdderConfigModule } from 'src/adder-config/adder-config.module';
import { ADDER_CONFIG } from 'src/adder-config/adder-config.schema';
import { AdderConfigService } from 'src/adder-config/adder-config.service';
import { ServiceResponse } from 'src/app/common';
import { MyLoggerModule } from 'src/app/my-logger/my-logger.module';
import { MyLogger } from 'src/app/my-logger/my-logger.service';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { CASH_PAYMENT_CONFIG } from 'src/cash-payment-configs/cash-payment-config.schema';
import { CashPaymentConfigService } from 'src/cash-payment-configs/cash-payment-config.service';
import { ContactModule } from 'src/contacts/contact.module';
import { CustomerPaymentModule } from 'src/customer-payments/customer-payment.module';
import { EmailModule } from 'src/emails/email.module';
import { EmailService } from 'src/emails/email.service';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { ExternalService } from 'src/external-services/external-service.service';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { FUNDING_SOURCE } from 'src/funding-sources/funding-source.schema';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { LeaseSolverConfigModule } from 'src/lease-solver-configs/lease-solver-config.module';
import { LEASE_SOLVER_CONFIG } from 'src/lease-solver-configs/lease-solver-config.schema';
import { LeaseSolverConfigService } from 'src/lease-solver-configs/lease-solver-config.service';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductModule } from 'src/products/product.module';
import { PRODUCT } from 'src/products/product.schema';
import { ProductService } from 'src/products/product.service';
import { ProposalSectionMasterModule } from 'src/proposal-section-masters/proposal-section-master.module';
import { ProposalTemplateModule } from 'src/proposal-templates/proposal-template.module';
import { PROPOSAL_TEMPLATE } from 'src/proposal-templates/proposal-template.schema';
import { ProposalTemplateService } from 'src/proposal-templates/proposal-template.service';
import { ProposalModule } from 'src/proposals/proposal.module';
import { PROPOSAL } from 'src/proposals/proposal.schema';
import { ProposalService } from 'src/proposals/proposal.service';
import { QualificationModule } from 'src/qualifications/qualification.module';
import { QUALIFICATION_CREDIT } from 'src/qualifications/qualification.schema';
import { QualificationService } from 'src/qualifications/qualification.service';
import { FNI_COMMUNICATION } from 'src/qualifications/schemas/fni-communication.schema';
import { FniEngineService } from 'src/qualifications/sub-services/fni-engine.service';
import { QuoteModule } from 'src/quotes/quote.module';
import { QUOTE } from 'src/quotes/quote.schema';
import { QuoteService } from 'src/quotes/quote.service';
import { TAX_CREDIT_CONFIG } from 'src/quotes/schemas/tax-credit-config.schema';
import { CalculationService } from 'src/quotes/sub-services';
import { PV_WATT_SYSTEM_PRODUCTION } from 'src/system-designs/schemas/pv-watt-system-production.schema';
import { SystemProductService, UploadImageService } from 'src/system-designs/sub-services';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { SYSTEM_DESIGN } from 'src/system-designs/system-design.schema';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { UTILITIES } from 'src/utilities/schemas';
import { UtilityModule } from 'src/utilities/utility.module';
import { GENABILITY_COST_DATA, GENABILITY_USAGE_DATA, UTILITY_USAGE_DETAILS } from 'src/utilities/utility.schema';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterModule } from 'src/utility-programs-master/utility-program-master.module';
import { UTILITY_PROGRAM_MASTER } from 'src/utility-programs-master/utility-program-master.schema';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { ProgressController } from '../progress.controller';
import { ProgressModule } from '../progress.module';
import { ProgressService } from '../progress.service';
import { ProgressDto } from '../res/progress.dto';

describe('Progress Controller', () => {
  let progressController: ProgressController;

  beforeEach(async () => {
    jest.useFakeTimers();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ProgressModule,
        UtilityModule,
        SystemDesignModule,
        QuoteModule,
        ProposalModule,
        QualificationModule,
        ExternalServiceModule,
        MyLoggerModule,
        ProductModule,
        AdderConfigModule,
        UtilityProgramMasterModule,
        FundingSourceModule,
        CashPaymentConfigModule,
        LeaseSolverConfigModule,
        EmailModule,
        ProposalTemplateModule,
        ProposalSectionMasterModule,
        OpportunityModule,
        ContactModule,
        CustomerPaymentModule,
        JwtModule.register({
          secret: '123',
          signOptions: {
            expiresIn: '1000s',
          },
        }),
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
      ],
      providers: [
        ProgressService,
        UtilityService,
        {
          provide: getModelToken(GENABILITY_USAGE_DATA),
          useValue: {},
        },
        {
          provide: getModelToken(UTILITIES),
          useValue: {},
        },
        {
          provide: getModelToken(GENABILITY_COST_DATA),
          useValue: {},
        },
        {
          provide: getModelToken(UTILITY_USAGE_DETAILS),
          useValue: {},
        },
        SystemDesignService,
        SystemProductService,
        UploadImageService,
        {
          provide: getModelToken(SYSTEM_DESIGN),
          useValue: {},
        },
        {
          provide: getModelToken(PV_WATT_SYSTEM_PRODUCTION),
          useValue: {},
        },
        QuoteService,
        CalculationService,
        {
          provide: getModelToken(QUOTE),
          useValue: {},
        },
        {
          provide: getModelToken(TAX_CREDIT_CONFIG),
          useValue: {},
        },
        ProposalService,
        ProposalTemplateService,
        EmailService,
        {
          provide: getModelToken(PROPOSAL),
          useValue: {},
        },
        {
          provide: getModelToken(PROPOSAL_TEMPLATE),
          useValue: {},
        },
        QualificationService,
        FniEngineService,
        {
          provide: getModelToken(QUALIFICATION_CREDIT),
          useValue: {},
        },
        {
          provide: getModelToken(FNI_COMMUNICATION),
          useValue: {},
        },
        ExternalService,
        MyLogger,
        ProductService,
        {
          provide: getModelToken(PRODUCT),
          useValue: {},
        },
        AdderConfigService,
        {
          provide: getModelToken(ADDER_CONFIG),
          useValue: {},
        },
        UtilityProgramMasterService,
        {
          provide: getModelToken(UTILITY_PROGRAM_MASTER),
          useValue: {},
        },
        FundingSourceService,
        {
          provide: getModelToken(FUNDING_SOURCE),
          useValue: {},
        },
        CashPaymentConfigService,
        {
          provide: getModelToken(CASH_PAYMENT_CONFIG),
          useValue: {},
        },
        LeaseSolverConfigService,
        {
          provide: getModelToken(LEASE_SOLVER_CONFIG),
          useValue: {},
        },
      ],
    }).compile();

    progressController = moduleRef.get<ProgressController>(ProgressController);
  });

  test('should getCounter work correctly', async () => {
    const res = await progressController.getCounter('oopId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(ProgressDto);
    expect(res.status).toEqual(expect.any(String));
  });
});
