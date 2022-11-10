import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AdderConfigModule } from 'src/adder-config/adder-config.module';
import { ServiceResponse } from 'src/app/common';
import { MyLoggerModule } from 'src/app/my-logger/my-logger.module';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { LeaseSolverConfigModule } from 'src/lease-solver-configs/lease-solver-config.module';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductModule } from 'src/products/product.module';
import { QuoteModule } from 'src/quotes/quote.module';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { UtilityModule } from 'src/utilities/utility.module';
import { UtilityProgramMasterModule } from 'src/utility-programs-master/utility-program-master.module';
import { SAVE_TEMPLATE_MODE, SYSTEM_TYPE, TEMPLATE_STATUS, DOCUSIGN_CONTRACT_TYPE } from '../constants';
import { DocusignTemplateMasterController } from '../docusign-template-master.controller';
import { DocusignTemplateMasterModule } from '../docusign-template-master.module';
import { DOCUSIGN_TEMPLATE_MASTER } from '../docusign-template-master.schema';
import {
  GetContractApplicabilityDataDto,
  GetContractCompositeTemplateDto,
  GetSignerRoleMasterDto,
  GetTemplateMasterDto,
  SaveContractCompositeTemplateDto,
  SaveTemplateDto,
} from '../res';
import { DOCUSIGN_COMPOSITE_TEMPLATE_MASTER } from '../schemas';
import { SIGNER_ROLE_MASTER } from '../schemas/signer-role-master.schema';

describe('Docusign Template Master Controller', () => {
  let docusignTemplateMasterController: DocusignTemplateMasterController;
  const mockModelRes = {
    template_name: 'template_name',
    description: 'description',
    docusign_template_id: 'docusign_template_id',
    recipient_roles: [Types.ObjectId()],
    template_status: 'template_status',
  };

  const mockRepository = {
    find: jest.fn().mockResolvedValue([
      {
        ...mockModelRes,
        toObject: jest.fn().mockReturnValue(mockModelRes),
      },
    ]),
    findById: jest.fn().mockResolvedValue({
      ...mockModelRes,
      toObject: jest.fn().mockReturnValue(mockModelRes),
    }),
    countDocuments: jest.fn().mockResolvedValue(1),
    save: jest.fn(),
  };

  const mockRepository1 = {
    findById: jest.fn().mockResolvedValue({
      role_name: 'role_name',
      role_description: 'role_description',
      toObject: jest.fn().mockReturnValue({ role_name: 'role_name', role_description: 'role_description' }),
    }),
    find: jest.fn().mockResolvedValue([
      {
        role_name: 'role_name',
        role_description: 'role_description',
        toObject: jest.fn().mockReturnValue({ role_name: 'role_name', role_description: 'role_description' }),
      },
    ]),
  };

  const mockDocusignCompositeTemplateMasterModelRespository = {
    find: jest.fn().mockResolvedValue([
      {
        name: 'name',
        description: 'description',
        docusign_template_ids: ['docusign_template_ids'],
        is_applicable_for_change_orders: true,
        applicable_funding_sources: ['applicable_funding_sources'],
        applicable_utility_programs: ['applicable_utility_programs'],
        applicable_utilities: ['applicable_utilities'],
        applicable_states: ['applicable_states'],
        applicable_system_types: ['applicable_system_types'],
        toObject: jest.fn().mockReturnValue({
          name: 'name',
          description: 'description',
          docusign_template_ids: ['docusign_template_ids'],
          is_applicable_for_change_orders: true,
          applicable_funding_sources: ['applicable_funding_sources'],
          applicable_utility_programs: ['applicable_utility_programs'],
          applicable_utilities: ['applicable_utilities'],
          applicable_states: ['applicable_states'],
          applicable_system_types: ['applicable_system_types'],
        }),
      },
    ]),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DocusignTemplateMasterModule,
        UtilityProgramMasterModule,
        FundingSourceModule,
        UtilityModule,
        ExternalServiceModule,
        MyLoggerModule,
        SystemDesignModule,
        QuoteModule,
        ProductModule,
        AdderConfigModule,
        CashPaymentConfigModule,
        LeaseSolverConfigModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
        OpportunityModule,
      ],
    })
      .overrideProvider(getModelToken(DOCUSIGN_TEMPLATE_MASTER))
      .useValue(mockRepository)
      .overrideProvider(getModelToken(SIGNER_ROLE_MASTER))
      .useValue(mockRepository1)
      .overrideProvider(getModelToken(DOCUSIGN_COMPOSITE_TEMPLATE_MASTER))
      .useValue(mockDocusignCompositeTemplateMasterModelRespository)
      .compile();

    docusignTemplateMasterController = moduleRef.get<DocusignTemplateMasterController>(
      DocusignTemplateMasterController,
    );
  });

  test('should getDocusignTemplatesMaster work correctly', async () => {
    const res = await docusignTemplateMasterController.getDocusignTemplatesMaster();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(GetTemplateMasterDto);
  });

  test('should getSignerRoleMasters work correctly', async () => {
    const res = await docusignTemplateMasterController.getSignerRoleMasters();

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(GetSignerRoleMasterDto);
  });

  test('should getContractCompositeTemplates work correctly', async () => {
    const res = await docusignTemplateMasterController.getContractCompositeTemplates();

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(GetContractCompositeTemplateDto);
  });

  test('should getContractApplicabilityData work correctly', async () => {
    const res = await docusignTemplateMasterController.getContractApplicabilityData();

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(GetContractApplicabilityDataDto);
  });

  test('should saveContractCompositeTemplate work correctly', async () => {
    const req = {
      mode: SAVE_TEMPLATE_MODE.NEW,
      compositeTemplateData: {
        id: 'string',
        name: 'string',
        description: 'string',
        docusignTemplateIds: ['string'],
        isApplicableForChangeOrders: true,
        applicableFundingSources: ['string'],
        applicableUtilityPrograms: ['string'],
        applicableUtilities: ['string'],
        applicableStates: ['string'],
        applicableSystemTypes: [SYSTEM_TYPE.ALL],
        createdAt: new Date('1/19/2020'),
        updatedAt: new Date('1/19/2020'),
      },
    };
    const res = await docusignTemplateMasterController.saveContractCompositeTemplate(req);

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(SaveContractCompositeTemplateDto);
  });

  test('should saveTemplate work correctly', async () => {
    const req = {
      mode: SAVE_TEMPLATE_MODE.NEW,
      templateData: {
        id: 'string',
        templateName: 'string',
        description: 'string',
        docusignTemplateId: 'string',
        templateStatus: TEMPLATE_STATUS.ACTIVE,
        recipientRoles: ['string'],
        contractType: DOCUSIGN_CONTRACT_TYPE.SALES_DOCUMENT,
      },
    };
    const res = await docusignTemplateMasterController.saveTemplate(req);

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(SaveTemplateDto);
  });
});
