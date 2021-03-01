import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AdderConfigModule } from 'src/adder-config/adder-config.module';
import { ServiceResponse } from 'src/app/common';
import { MyLoggerModule } from 'src/app/my-logger/my-logger.module';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { EmailModule } from 'src/emails/email.module';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { LeaseSolverConfigModule } from 'src/lease-solver-configs/lease-solver-config.module';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductModule } from 'src/products/product.module';
import { QuoteModule } from 'src/quotes/quote.module';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { UtilityProgramMasterModule } from 'src/utility-programs-master/utility-program-master.module';
import {
  CostDataDto, TariffDto, UtilityDataDto, UtilityDetailsDto,
} from '../res';
import { UtilityController } from '../utility.controller';
import { UtilityModule } from '../utility.module';
import { GENABILITY_USAGE_DATA, UTILITY_USAGE_DETAILS } from '../utility.schema';

describe('Proposal Section Master Controller', () => {
  let utilityController: UtilityController;

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            name: 'name',
            component_name: 'componentName',
            applicable_products: ['applicableProducts'],
            applicable_financial_products: ['applicableFinancialProducts'],
            toObject: jest.fn().mockReturnValue({
              name: 'name',
              component_name: 'componentName',
              applicable_products: ['applicableProducts'],
              applicable_financial_products: ['applicableFinancialProducts'],
            }),
          },
        ]),
      }),
    }),
    countDocuments: jest.fn().mockReturnValueOnce(1),
    findOne: jest.fn().mockResolvedValue({
      opportunity_id: 'opportunity_id',
      utility_data: { typical_baseline_usage: { _id: 'typical_baseline_usage_ID' } },
      cost_data: {},
      toObject: jest.fn().mockReturnValue({
        opportunity_id: 'opportunity_id',
        utility_data: { typical_baseline_usage: { _id: 'typical_baseline_usage_ID' } },
        cost_data: {},
      }),
    }),
    findByIdAndUpdate: jest.fn().mockResolvedValue({
      opportunity_id: 'opportunity_id',
      utility_data: { typical_baseline_usage: { _id: 'typical_baseline_usage_ID' } },
      cost_data: {},
      toObject: jest.fn().mockReturnValue({
        opportunity_id: 'opportunity_id',
        utility_data: { typical_baseline_usage: { _id: 'typical_baseline_usage_ID' } },
        cost_data: {},
      }),
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        UtilityModule,
        EmailModule,
        ExternalServiceModule,
        MyLoggerModule,
        SystemDesignModule,
        QuoteModule,
        ProductModule,
        AdderConfigModule,
        UtilityProgramMasterModule,
        FundingSourceModule,
        CashPaymentConfigModule,
        LeaseSolverConfigModule,
        OpportunityModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
      ],
      providers: [
        {
          provide: getModelToken(GENABILITY_USAGE_DATA),
          useValue: {},
        },
      ],
    })
      .overrideProvider(getModelToken(UTILITY_USAGE_DETAILS))
      .useValue(mockRepository)
      .compile();

    utilityController = moduleRef.get<UtilityController>(UtilityController);
  });

  test('should getList work correctly', async () => {
    const res = await utilityController.getTypicalBaseline('123456');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(UtilityDataDto);
  });

  test('should getTariff work correctly', async () => {
    const res = await utilityController.getTariff({ zipCode: '123456', lseId: '734' });

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(TariffDto);
  });

  test('should calculateTypicalUsageCost work correctly', async () => {
    const res = await utilityController.calculateTypicalUsageCost({ zipCode: '123456', masterTariffId: '734' });

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(CostDataDto);
  });

  test('should calculateActualUsageCost work correctly', async () => {
    const req = {
      masterTariffId: 'string',
      zipCode: 0,
      utilityData: {
        typicalBaselineUsage: {
          zipCode: 0,
          buildingType: 'string',
          customerClass: 'string',
          lseName: 'string',
          lseId: 0,
          sourceType: 'string',
          annualConsumption: 0,
          typicalMonthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
        actualUsage: {
          zipCode: 0,
          sourceType: 'string',
          annualConsumption: 0,
          monthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
      },
    };

    const res = await utilityController.calculateActualUsageCost(req);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(CostDataDto);
  });

  test('should createActualUsages work correctly', async () => {
    const req = {
      costData: {
        masterTariffId: 'string',
        typicalUsageCost: {
          startDate: '2021-01-14T02:33:11.548Z',
          endDate: '2021-01-14T02:33:11.548Z',
          interval: 'string',
          cost: [
            {
              startDate: '2021-01-14T02:33:11.548Z',
              endDate: '2021-01-14T02:33:11.548Z',
              i: 0,
              v: 0,
            },
          ],
        },
        actualUsageCost: {
          startDate: '2021-01-14T02:33:11.548Z',
          endDate: '2021-01-14T02:33:11.548Z',
          interval: 'string',
          cost: [
            {
              startDate: '2021-01-14T02:33:11.548Z',
              endDate: '2021-01-14T02:33:11.548Z',
              i: 0,
              v: 0,
            },
          ],
        },
      },
      utilityData: {
        loadServingEntityData: {
          lseName: 'string',
          lseCode: 'string',
          zipCode: 0,
          serviceType: 'string',
          lseId: 'string',
        },
        typicalBaselineUsage: {
          zipCode: 0,
          buildingType: 'string',
          customerClass: 'string',
          lseName: 'string',
          lseId: 0,
          sourceType: 'string',
          annualConsumption: 0,
          typicalMonthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
        actualUsage: {
          zipCode: 0,
          sourceType: 'string',
          annualConsumption: 0,
          monthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
      },
    };
    const res = await utilityController.createActualUsages(req as any);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(UtilityDataDto);
  });

  test('should createUtility work correctly', async () => {
    const req = {
      opportunityId: 'string',
      utilityData: {
        loadServingEntityData: {
          lseName: 'string',
          lseCode: 'string',
          zipCode: 0,
          serviceType: 'string',
          lseId: 'string',
        },
        typicalBaselineUsage: {
          zipCode: 0,
          buildingType: 'string',
          customerClass: 'string',
          lseName: 'string',
          lseId: 0,
          sourceType: 'string',
          annualConsumption: 0,
          typicalMonthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
          typicalHourlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
        actualUsage: {
          zipCode: 0,
          sourceType: 'string',
          annualConsumption: 0,
          monthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
      },
      costData: {
        masterTariffId: 'string',
        typicalUsageCost: {
          startDate: '2021-01-14T03:18:55.985Z',
          endDate: '2021-01-14T03:18:55.985Z',
          interval: 'string',
          cost: [
            {
              startDate: '2021-01-14T03:18:55.985Z',
              endDate: '2021-01-14T03:18:55.985Z',
              i: 0,
              v: 0,
            },
          ],
        },
        actualUsageCost: {
          startDate: '2021-01-14T03:18:55.985Z',
          endDate: '2021-01-14T03:18:55.985Z',
          interval: 'string',
          cost: [
            {
              startDate: '2021-01-14T03:18:55.985Z',
              endDate: '2021-01-14T03:18:55.985Z',
              i: 0,
              v: 0,
            },
          ],
        },
      },
    };
    const res = await utilityController.createUtility(req as any);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(UtilityDetailsDto);
  });

  test('should updateUtility work correctly', async () => {
    const req = {
      opportunityId: 'string',
      utilityData: {
        loadServingEntityData: {
          lseName: 'string',
          lseCode: 'string',
          zipCode: 0,
          serviceType: 'string',
          lseId: 'string',
        },
        typicalBaselineUsage: {
          zipCode: 0,
          buildingType: 'string',
          customerClass: 'string',
          lseName: 'string',
          lseId: 0,
          sourceType: 'string',
          annualConsumption: 0,
          typicalMonthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
          typicalHourlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
        actualUsage: {
          zipCode: 0,
          sourceType: 'string',
          annualConsumption: 0,
          monthlyUsage: [
            {
              i: 0,
              v: 0,
            },
          ],
        },
      },
      costData: {
        masterTariffId: 'string',
        typicalUsageCost: {
          startDate: '2021-01-14T03:18:55.985Z',
          endDate: '2021-01-14T03:18:55.985Z',
          interval: 'string',
          cost: [
            {
              startDate: '2021-01-14T03:18:55.985Z',
              endDate: '2021-01-14T03:18:55.985Z',
              i: 0,
              v: 0,
            },
          ],
        },
        actualUsageCost: {
          startDate: '2021-01-14T03:18:55.985Z',
          endDate: '2021-01-14T03:18:55.985Z',
          interval: 'string',
          cost: [
            {
              startDate: '2021-01-14T03:18:55.985Z',
              endDate: '2021-01-14T03:18:55.985Z',
              i: 0,
              v: 0,
            },
          ],
        },
      },
    };
    const res = await utilityController.updateUtility('utilityId', req as any);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(UtilityDetailsDto);
  });

  test('should getUtilityUsageDetail work correctly', async () => {
    const res = await utilityController.getUtilityUsageDetail('opportunityId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(UtilityDetailsDto);
  });
});
