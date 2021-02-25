import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AdderConfigModule } from 'src/adder-config/adder-config.module';
import { Pagination, ServiceResponse } from 'src/app/common';
import { MyLoggerModule } from 'src/app/my-logger/my-logger.module';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { FUNDING_SOURCE } from 'src/funding-sources/funding-source.schema';
import { LeaseSolverConfigModule } from 'src/lease-solver-configs/lease-solver-config.module';
import { LEASE_SOLVER_CONFIG } from 'src/lease-solver-configs/lease-solver-config.schema';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductModule } from 'src/products/product.module';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { SYSTEM_DESIGN } from 'src/system-designs/system-design.schema';
import { UtilityModule } from 'src/utilities/utility.module';
import { UtilityProgramMasterModule } from 'src/utility-programs-master/utility-program-master.module';
import { FINANCE_PRODUCT_TYPE } from '../constants';
import { QuoteController } from '../quote.controller';
import { QuoteModule } from '../quote.module';
import { QUOTE } from '../quote.schema';
import { QuoteService } from '../quote.service';
import { QuoteDto } from '../res/quote.dto';
import { TAX_CREDIT_CONFIG } from '../schemas/tax-credit-config.schema';

describe('Quote Controller', () => {
  let quoteController: QuoteController;
  let quoteService: QuoteService;

  const mockFundingSource = {
    findById: jest.fn().mockResolvedValue({
      name: 'name',
      isTrancheApplicable: 'isTrancheApplicable',
      type: 'type',
    }),
  };

  const mockLeaseSolverConfig = {
    findOne: jest.fn().mockResolvedValue({}),
  };

  class MockRespository {
    static mockModel = {
      opportunity_id: 'opportunity_id',
      system_design_id: 'system_design_id',
      quote_model_type: 'quote_model_type',
      detailed_quote: {
        quote_name: 'quote_name',
        is_selected: true,
        is_retrofit: true,
        is_solar: true,
        system_production: {},
        quote_finance_product: {
          finance_product: {
            product_type: FINANCE_PRODUCT_TYPE.CASH,
            product_attribute: {
              upfront_payment: 1000,
            },
          },
          net_amount: 1,
          incentive_details: [
            {
              unit: 'amount',
              unit_value: 1,
              type: 'type',
              applies_to: 'applies_to',
              description: 'description',
            },
          ],
          rebate_details: [
            {
              amount: 123,
              type: 'type',
              description: 'description',
            },
          ],
          project_discount_details: [
            {
              unit: 'string',
              unit_value: 123,
              exclude_adders: true,
              description: 'string',
            },
          ],
        },
        savings_details: [],
        quote_cost_buildup: {
          panel_quote_details: [
            {
              panel_model_id: '123',
            },
          ],
          inverter_quote_details: [
            {
              inverter_model_id: '123',
            },
          ],
          storage_quote_details: [
            {
              storage_model_id: '123',
            },
          ],
          adder_quote_details: [
            {
              adder_model_id: '123',
            },
          ],
          overall_markup: 100,
          total_product_cost: 10,
          labor_cost: {},
          gross_amount: 100,
        },
        tax_credit_data: [],
        utility_program_selected_for_reinvestment: true,
        tax_credit_selected_for_reinvestment: true,
        utility_program: null,
      },
      is_sync: true,
    };

    data: any;
    constructor(data) {
      this.data = data;
    }
    save(data) {
      return data;
    }
    toObject() {
      return this.data;
    }

    static findById = jest.fn().mockResolvedValue({
      ...MockRespository.mockModel,
      toObject: jest.fn().mockReturnValue(MockRespository.mockModel),
    });
    static find = jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            ...MockRespository.mockModel,
            toObject: jest.fn().mockReturnValue(MockRespository.mockModel),
          },
        ]),
      }),
    });
    static estimatedDocumentCount = jest.fn().mockResolvedValue(1);
    static findByIdAndUpdate = jest
      .fn()
      .mockResolvedValue({ toObject: jest.fn().mockReturnValue(MockRespository.mockModel) });
  }

  const mockSystemDesign = {
    findById: jest.fn().mockResolvedValue({
      toObject: jest.fn().mockReturnValue({
        id: 'string',
        opportunity_id: 'string',
        design_mode: 'string',
        name: 'string',
        roof_top_design_data: {
          panel_array: [
            {
              primary_orientation_side: 0,
              panel_orientation: 'string',
              bound_polygon: [
                {
                  lat: 0,
                  lng: 0,
                },
              ],
              panels: [
                [
                  {
                    lat: 0,
                    lng: 0,
                  },
                ],
              ],
              setbacks: {},
              setbacks_polygon: [
                {
                  lat: 0,
                  lng: 0,
                },
              ],
              keepouts: [
                [
                  {
                    lat: 0,
                    lng: 0,
                  },
                ],
              ],
              pitch: 0,
              azimuth: 0,
              row_spacing: 0,
              panel_model_data_snapshot: {
                name: 'string',
                type: 'string',
                price: 0,
                sizeW: 0,
                sizekWh: 0,
                part_number: ['string'],
              },
              panel_model_snapshot_date: '2021-01-19T00:06:07.985Z',
              number_of_panels: 0,
            },
          ],
          inverters: [
            {
              id: 'string',
              type: 'central',
              inverter_model_id: 'string',
              inverter_model_data_snapshot: {
                name: 'string',
                type: 'string',
                price: 0,
                sizeW: 0,
                sizekWh: 0,
                part_number: ['string'],
              },
              inverter_model_snapshot_date: '2021-01-19T00:06:07.985Z',
            },
          ],
          storage: [
            {
              id: 'string',
              type: 'BACKUP_POWER',
              storage_model_id: 'string',
              quantity: 0,
              storage_model_data_snapshot: {
                name: 'string',
                type: 'string',
                price: 0,
                sizeW: 0,
                sizekWh: 0,
                part_number: ['string'],
              },
              storage_model_snapshot_date: '2021-01-19T00:06:07.985Z',
            },
          ],
          adders: [
            {
              adder_description: 'string',
              quantity: 0,
              adder_id: 'string',
              adder_model_data_snapshot: {
                id: 'string',
                adder: 'string',
                price: 0,
                increment: 'string',
                modified_at: '2021-01-19T00:06:07.985Z',
              },
              adder_model_snapshot_date: '2021-01-19T00:06:07.985Z',
            },
          ],
        },
        capacity_production_design_data: {
          capacity: 0,
          production: 0,
          number_of_panels: 0,
          panel_model_id: 0,
          inverters: [
            {
              id: 'string',
              type: 'central',
              inverter_model_id: 'string',
              inverter_model_data_snapshot: {
                name: 'string',
                type: 'string',
                price: 0,
                sizeW: 0,
                sizekWh: 0,
                part_number: ['string'],
              },
              inverter_model_snapshot_date: '2021-01-19T00:06:07.985Z',
            },
          ],
          storage: [
            {
              id: 'string',
              type: 'BACKUP_POWER',
              storage_model_id: 'string',
              quantity: 0,
              storage_model_data_snapshot: {
                name: 'string',
                type: 'string',
                price: 0,
                sizeW: 0,
                sizekWh: 0,
                part_number: ['string'],
              },
              storage_model_snapshot_date: '2021-01-19T00:06:07.985Z',
            },
          ],
        },
        system_production_data: {
          capacityKW: 0,
          generationKWh: 0,
          productivity: 0,
          annual_usageKWh: 0,
          offset_percentage: 0,
        },
        latitude: 0,
        longtitude: 0,
        thumbnail: 'string',
        is_selected: true,
        is_retrofit: true,
        is_solar: true,
      }),
    }),
  };

  const mockTaxCreditConfig = {
    findOne: jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue({}) }),
    find: jest.fn().mockResolvedValue([]),
    estimatedDocumentCount: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        QuoteModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
        SystemDesignModule,
        UtilityProgramMasterModule,
        FundingSourceModule,
        CashPaymentConfigModule,
        LeaseSolverConfigModule,
        UtilityModule,
        ProductModule,
        AdderConfigModule,
        ExternalServiceModule,
        MyLoggerModule,
        OpportunityModule,
      ],
    })
      .overrideProvider(getModelToken(QUOTE))
      .useValue(MockRespository)
      .overrideProvider(getModelToken(FUNDING_SOURCE))
      .useValue(mockFundingSource)
      .overrideProvider(getModelToken(LEASE_SOLVER_CONFIG))
      .useValue(mockLeaseSolverConfig)
      .overrideProvider(getModelToken(SYSTEM_DESIGN))
      .useValue(mockSystemDesign)
      .overrideProvider(getModelToken(TAX_CREDIT_CONFIG))
      .useValue(mockTaxCreditConfig)
      .compile();

    quoteService = moduleRef.get<QuoteService>(QuoteService);
    quoteController = moduleRef.get<QuoteController>(QuoteController);
  });

  test('should create work correctly', async () => {
    const req = {
      opportunityId: '5fe407b5442da9d33e3da031',
      systemDesignId: '5fe407b5442da9d33e3da031',
      fundingSourceId: '5fe407b5442da9d33e3da031',
      utilityProgramId: '5fe407b5442da9d33e3da031',
      quoteName: 'quoteName',
    };
    const res = await quoteController.create(req);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(QuoteDto);
  });

  test('should getAllTaxCredits work correctly', async () => {
    const res = await quoteController.getListTaxCredits();

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.data).toEqual(expect.any(Array));
  });

  test('should checkConditionsForLeaseQuote work correctly', async () => {
    const req = {
      opportunityId: 'string',
      systemDesignId: 'string',
      quoteName: 'string',
      isSelected: true,
      isSolar: true,
      isRetrofit: true,
      quoteCostBuildup: {
        panelQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            panelModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            panelModelSnapshotDate: '2021-01-26T03:13:03.190Z',
          },
        ],
        inverterQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            inverterModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            inverterModelSnapshotDate: '2021-01-26T03:13:03.190Z',
          },
        ],
        storageQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            storageModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            storageModelSnapshotDate: '2021-01-26T03:13:03.190Z',
          },
        ],
        adderQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            adderModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            adderModelSnapshotDate: '2021-01-26T03:13:03.190Z',
          },
        ],
        overallMarkup: 0,
        totalProductCost: 0,
        laborCost: {
          quantity: 0,
          cost: 0,
          markup: 0,
          netCost: 0,
          discountDetails: [
            {
              amount: 0,
              description: 'string',
            },
          ],
          laborCostDataSnapshot: {},
          laborCostSnapshotDate: '2021-01-26T03:13:03.190Z',
        },
        grossPrice: 0,
      },
      quoteFinanceProduct: {
        incentiveDetails: [
          {
            unit: 'string',
            unitValue: 0,
            type: 'string',
            appliesTo: 'string',
            description: 'string',
          },
        ],
        rebateDetails: [
          {
            amount: 0,
            type: 'string',
            description: 'string',
          },
        ],
        financeProduct: {
          productType: 'cash',
          fundingSourceId: 'string',
          fundingSourceName: 'string',
          netAmount: 0,
          productAttribute: {
            leaseTerm: 5,
            rateEscalator: 4,
          },
        },
        netAmount: 0,
        projectDiscountDetails: [
          {
            unit: 'string',
            unitValue: 0,
            appliesTo: 'string',
            description: 'string',
            excludeAdders: true,
          },
        ],
      },
      savingsDetails: [
        {
          year: 0,
          currentUtilityBill: 0,
          newUtilityBill: 0,
          payment: 0,
          discountAndIncentives: 0,
          annualSaving: 0,
        },
      ],
      isSync: true,
      taxCreditData: [
        {
          id: 'string',
          name: 'string',
          percentage: 0,
          taxCreditConfigDataSnapshot: {
            id: 'string',
            name: 'string',
            taxCreditPrecentage: 0,
            taxCreditStartDate: '2021-01-26T03:13:03.190Z',
            taxCreditEndDate: '2021-01-26T03:13:03.190Z',
          },
          taxCreditConfigDataSnapshotDate: '2021-01-26T03:13:03.190Z',
        },
      ],
      utilityProgramSelectedForReinvestment: true,
      taxCreditSelectedForReinvestment: true,
      quoteId: 'string',
      systemProduction: {
        capacityKW: 0,
        generationKWh: 0,
        productivity: 0,
        annualUsageKWh: 0,
        offsetPercentage: 0,
      },
      utilityProgram: {
        id: 'string',
        name: 'string',
        rebateAmount: 0,
      },
    };

    const res = await quoteController.checkConditionsForLeaseQuote(req as any);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toEqual(expect.any(String));
  });

  test('should getListQuotes work correctly', async () => {
    const res = await quoteController.getListQuotes(100, 0, 'systemDesignId', null);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.data).toEqual(expect.any(Array));
  });

  test('should getDetails work correctly', async () => {
    const res = await quoteController.getDetails('quoteId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(QuoteDto);
  });

  test('should updateQuote work correctly', async () => {
    const req = {
      opportunityId: 'string',
      systemDesignId: 'string',
      quoteName: 'string',
      isSelected: true,
      isSolar: true,
      isRetrofit: true,
      quoteCostBuildup: {
        panelQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            panelModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            panelModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        inverterQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            inverterModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            inverterModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        storageQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            storageModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            storageModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        adderQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            adderModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            adderModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        overallMarkup: 0,
        totalProductCost: 0,
        laborCost: {
          quantity: 0,
          cost: 0,
          markup: 0,
          netCost: 0,
          discountDetails: [
            {
              amount: 0,
              description: 'string',
            },
          ],
          laborCostDataSnapshot: {},
          laborCostSnapshotDate: '2021-01-26T04:34:30.740Z',
        },
        grossPrice: 0,
      },
      quoteFinanceProduct: {
        incentiveDetails: [
          {
            unit: 'string',
            unitValue: 0,
            type: 'string',
            appliesTo: 'string',
            description: 'string',
          },
        ],
        rebateDetails: [
          {
            amount: 0,
            type: 'string',
            description: 'string',
          },
        ],
        financeProduct: {
          productType: FINANCE_PRODUCT_TYPE.CASH,
          fundingSourceId: 'string',
          fundingSourceName: 'string',
          netAmount: 0,
        },
        netAmount: 0,
        projectDiscountDetails: [
          {
            unit: 'string',
            unitValue: 0,
            appliesTo: 'string',
            description: 'string',
            excludeAdders: true,
          },
        ],
      },
      savingsDetails: [
        {
          year: 0,
          currentUtilityBill: 0,
          newUtilityBill: 0,
          payment: 0,
          discountAndIncentives: 0,
          annualSaving: 0,
        },
      ],
      isSync: true,
      taxCreditData: [
        {
          id: 'string',
          name: 'string',
          percentage: 0,
          taxCreditConfigDataSnapshot: {
            id: 'string',
            name: 'string',
            taxCreditPrecentage: 0,
            taxCreditStartDate: '2021-01-26T04:34:30.741Z',
            taxCreditEndDate: '2021-01-26T04:34:30.741Z',
          },
          taxCreditConfigDataSnapshotDate: '2021-01-26T04:34:30.741Z',
        },
      ],
      utilityProgramSelectedForReinvestment: true,
      taxCreditSelectedForReinvestment: true,
    };
    const res = await quoteController.updateQuote(req as any, 'quoteId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(QuoteDto);
  });

  test('should updateLatestQuote work correctly', async () => {
    const req = {
      opportunityId: 'string',
      systemDesignId: 'string',
      quoteName: 'string',
      isSelected: true,
      isSolar: true,
      isRetrofit: true,
      quoteCostBuildup: {
        panelQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            panelModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            panelModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        inverterQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            inverterModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            inverterModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        storageQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            storageModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            storageModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        adderQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            adderModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            adderModelSnapshotDate: '2021-01-26T04:34:30.740Z',
          },
        ],
        overallMarkup: 0,
        totalProductCost: 0,
        laborCost: {
          quantity: 0,
          cost: 0,
          markup: 0,
          netCost: 0,
          discountDetails: [
            {
              amount: 0,
              description: 'string',
            },
          ],
          laborCostDataSnapshot: {},
          laborCostSnapshotDate: '2021-01-26T04:34:30.740Z',
        },
        grossPrice: 0,
      },
      quoteFinanceProduct: {
        incentiveDetails: [
          {
            unit: 'string',
            unitValue: 0,
            type: 'string',
            appliesTo: 'string',
            description: 'string',
          },
        ],
        rebateDetails: [
          {
            amount: 0,
            type: 'string',
            description: 'string',
          },
        ],
        financeProduct: {
          productType: FINANCE_PRODUCT_TYPE.CASH,
          fundingSourceId: 'string',
          fundingSourceName: 'string',
          netAmount: 0,
        },
        netAmount: 0,
        projectDiscountDetails: [
          {
            unit: 'string',
            unitValue: 0,
            appliesTo: 'string',
            description: 'string',
            excludeAdders: true,
          },
        ],
      },
      savingsDetails: [
        {
          year: 0,
          currentUtilityBill: 0,
          newUtilityBill: 0,
          payment: 0,
          discountAndIncentives: 0,
          annualSaving: 0,
        },
      ],
      isSync: true,
      taxCreditData: [
        {
          id: 'string',
          name: 'string',
          percentage: 0,
          taxCreditConfigDataSnapshot: {
            id: 'string',
            name: 'string',
            taxCreditPrecentage: 0,
            taxCreditStartDate: '2021-01-26T04:34:30.741Z',
            taxCreditEndDate: '2021-01-26T04:34:30.741Z',
          },
          taxCreditConfigDataSnapshotDate: '2021-01-26T04:34:30.741Z',
        },
      ],
      utilityProgramSelectedForReinvestment: true,
      taxCreditSelectedForReinvestment: true,
    };
    const res = await quoteController.updateLatestQuote(req as any, 'quoteId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(QuoteDto);
  });

  test('should calculateQuoteDetails work correctly', async () => {
    const req = {
      opportunityId: 'string',
      systemDesignId: 'string',
      quoteName: 'string',
      isSelected: true,
      isSolar: true,
      isRetrofit: true,
      quoteCostBuildup: {
        panelQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            panelModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            panelModelSnapshotDate: '2021-01-26T08:07:55.388Z',
          },
        ],
        inverterQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            inverterModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            inverterModelSnapshotDate: '2021-01-26T08:07:55.388Z',
          },
        ],
        storageQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            storageModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            storageModelSnapshotDate: '2021-01-26T08:07:55.388Z',
          },
        ],
        adderQuoteDetails: [
          {
            quantity: 0,
            cost: 0,
            markup: 0,
            netCost: 0,
            discountDetails: [
              {
                amount: 0,
                description: 'string',
              },
            ],
            adderModelDataSnapshot: {
              name: 'string',
              type: 'string',
              price: 0,
              sizeW: 0,
              sizekWh: 0,
              partNumber: ['string'],
            },
            adderModelSnapshotDate: '2021-01-26T08:07:55.388Z',
          },
        ],
        overallMarkup: 0,
        totalProductCost: 0,
        laborCost: {
          quantity: 0,
          cost: 0,
          markup: 0,
          netCost: 0,
          discountDetails: [
            {
              amount: 0,
              description: 'string',
            },
          ],
          laborCostDataSnapshot: {},
          laborCostSnapshotDate: '2021-01-26T08:07:55.388Z',
        },
        grossPrice: 0,
      },
      quoteFinanceProduct: {
        incentiveDetails: [
          {
            unit: 'string',
            unitValue: 0,
            type: 'string',
            appliesTo: 'string',
            description: 'string',
          },
        ],
        rebateDetails: [
          {
            amount: 0,
            type: 'string',
            description: 'string',
          },
        ],
        financeProduct: {
          productType: FINANCE_PRODUCT_TYPE.CASH,
          fundingSourceId: 'string',
          fundingSourceName: 'string',
          netAmount: 0,
        },
        netAmount: 0,
        projectDiscountDetails: [
          {
            unit: 'string',
            unitValue: 0,
            appliesTo: 'string',
            description: 'string',
            excludeAdders: true,
          },
        ],
      },
      savingsDetails: [
        {
          year: 0,
          currentUtilityBill: 0,
          newUtilityBill: 0,
          payment: 0,
          discountAndIncentives: 0,
          annualSaving: 0,
        },
      ],
      isSync: true,
      taxCreditData: [
        {
          id: 'string',
          name: 'string',
          percentage: 0,
          taxCreditConfigDataSnapshot: {
            id: 'string',
            name: 'string',
            taxCreditPrecentage: 0,
            taxCreditStartDate: '2021-01-26T08:07:55.388Z',
            taxCreditEndDate: '2021-01-26T08:07:55.388Z',
          },
          taxCreditConfigDataSnapshotDate: '2021-01-26T08:07:55.388Z',
        },
      ],
      utilityProgramSelectedForReinvestment: true,
      taxCreditSelectedForReinvestment: true,
      quoteId: 'string',
      systemProduction: {
        capacityKW: 0,
        generationKWh: 0,
        productivity: 0,
        annualUsageKWh: 0,
        offsetPercentage: 0,
      },
      utilityProgram: {
        id: 'string',
        name: 'string',
        rebateAmount: 0,
      },
    };

    const res = await quoteController.calculateQuoteDetails(req as any);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Object);
  });
});
