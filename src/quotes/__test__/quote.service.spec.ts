import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import {
  FINANCE_PRODUCT_TYPE,
  INCENTIVE_APPLIES_TO_VALUE,
  INCENTIVE_UNITS,
  PROJECT_DISCOUNT_UNITS,
} from '../constants';
import { QuoteService } from '../quote.service';
import { QuoteDto } from '../res/quote.dto';

describe('Quote Service', () => {
  let quoteService: QuoteService;

  const mockSystemDesignService = {
    getOneById: jest.fn().mockResolvedValue({
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
  } as any;

  const mockModelRes = {
    opportunity_id: 'opportunity_id',
    system_design_id: 'system_design_id',
    quote_model_type: 'quote_model_type',
    utilityProgramId: 'utilityProgramId',
    detailed_quote: {
      quote_name: 'quote_name',
      is_selected: true,
      is_retrofit: true,
      is_solar: true,
      system_production: {},
      quote_finance_product: {
        finance_product: {
          product_type: FINANCE_PRODUCT_TYPE.LEASE,
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

  class MockQuoteModel {
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
      ...mockModelRes,
      toObject: jest.fn().mockReturnValue(mockModelRes),
    });

    static find = jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            ...mockModelRes,
            toObject: jest.fn().mockReturnValue(mockModelRes),
          },
        ]),
      }),
    });
    static estimatedDocumentCount = jest.fn().mockResolvedValue(1);
    static findByIdAndUpdate = jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue(mockModelRes) });
  }

  const mockModelRes1 = {
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
          product_type: FINANCE_PRODUCT_TYPE.LOAN,
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
      utility_program: {
        utility_program_id: 'utility_program_id',
        utility_program_name: 'utility_program_name',
        rebate_amount: 1000,
      },
    },
    is_sync: true,
  };

  class MockQuoteModel1 {
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
      ...mockModelRes1,
      toObject: jest.fn().mockReturnValue(mockModelRes1),
    });

    static find = jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            ...mockModelRes1,
            toObject: jest.fn().mockReturnValue(mockModelRes1),
          },
        ]),
      }),
    });
    static estimatedDocumentCount = jest.fn().mockResolvedValue(1);
    static findByIdAndUpdate = jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue(mockModelRes1) });
  }

  describe('createQuote function', () => {
    test(`should return undefined value`, async () => {
      class mockQuoteModel {
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
        static findOne = jest.fn().mockResolvedValue(null);
      }

      // const mockSystemDesignService = {
      //   getOneById: jest.fn().mockResolvedValue(mockSystemDesignModel),
      // } as any;

      const mockUtilityProgramService = {
        getDetailById: jest.fn().mockResolvedValue(null).mockResolvedValue({}),
      } as any;

      const mockFundingSourceService = {
        getDetailById: jest.fn().mockResolvedValue({ type: 'loan' }),
      } as any;

      quoteService = new QuoteService(
        mockQuoteModel as any,
        null,
        mockSystemDesignService,
        mockUtilityProgramService,
        mockFundingSourceService,
        null,
        null,
        null,
      );

      const res = await quoteService.createQuote({
        opportunityId: '5fe407b5442da9d33e3da031',
        systemDesignId: '5fe407b5442da9d33e3da031',
        fundingSourceId: '5fe407b5442da9d33e3da031',
        utilityProgramId: null,
        quoteName: 'quoteName',
      });

      const res1 = await quoteService.createQuote({
        opportunityId: '5fe407b5442da9d33e3da031',
        systemDesignId: '5fe407b5442da9d33e3da031',
        fundingSourceId: '5fe407b5442da9d33e3da031',
        utilityProgramId: '5fe407b5442da9d33e3da031',
        quoteName: 'quoteName',
      });

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(QuoteDto);
    });
  });

  describe('createProductAttribute function', () => {
    test(`should return Object wuith FINANCE_PRODUCT_TYPE.LEASE`, async () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);

      const res = await quoteService.createProductAttribute(FINANCE_PRODUCT_TYPE.LEASE, 1000);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(Object);
    });

    test('should return Object wuith FINANCE_PRODUCT_TYPE.CASH', async () => {
      const mockCashPaymentConfigService = {
        getFirst: jest
          .fn()
          .mockResolvedValue({ type: 'type', config: [{ name: 'string', percentage: 10 }] })
          .mockResolvedValue(null),
      } as any;

      quoteService = new QuoteService(null, null, null, null, null, mockCashPaymentConfigService, null, null);

      const quoteService1 = new QuoteService(null, null, null, null, null, mockCashPaymentConfigService, null, null);

      const res = await quoteService.createProductAttribute(FINANCE_PRODUCT_TYPE.CASH, 1000);
      const res1 = await quoteService1.createProductAttribute(FINANCE_PRODUCT_TYPE.CASH, 1000);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(Object);
      expect(res1).toBeInstanceOf(Object);
    });
  });

  describe('updateLatestQuote function', () => {
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
          productType: FINANCE_PRODUCT_TYPE.LEASE,
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

    test('should return Entity Not Found', async () => {
      const mockQuoteModel = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      quoteService = new QuoteService(mockQuoteModel, null, null, null, null, null, null, null);
      try {
        await quoteService.updateLatestQuote({} as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });

    test('should work with FINANCE_PRODUCT_TYPE.LEASE', async () => {
      const mockSystemDesignService = {
        getOneById: jest.fn().mockResolvedValue({
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
      } as any;
      quoteService = new QuoteService(
        MockQuoteModel as any,
        null,
        mockSystemDesignService,
        null,
        null,
        null,
        null,
        null,
      );
      const res = await quoteService.updateLatestQuote(req as any, 'quoteId');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(QuoteDto);
    });

    test('should work with FINANCE_PRODUCT_TYPE.LOAN', async () => {
      const mockUtilityProgramService = {
        getDetailById: jest
          .fn()
          .mockResolvedValue({ id: 'id', utility_program_name: 'utility_program_name', rebate_amount: 1900 }),
      } as any;
      quoteService = new QuoteService(
        MockQuoteModel1 as any,
        null,
        mockSystemDesignService,
        mockUtilityProgramService,
        null,
        null,
        null,
        null,
      );
      const res = await quoteService.updateLatestQuote(req as any, 'quoteId');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(QuoteDto);
    });
  });

  describe('getAllQuotes function', () => {
    test(`should return data with OpportunityId`, async () => {
      class mockQuoteModel {
        static find = jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue([
              {
                ...mockModelRes,
                toObject: jest.fn().mockReturnValue(mockModelRes),
              },
            ]),
          }),
        });
        static estimatedDocumentCount = jest.fn().mockResolvedValue(1);
      }

      quoteService = new QuoteService(mockQuoteModel as any, null, null, null, null, null, null, null);

      const res = await quoteService.getAllQuotes(100, 0, 'systemDesignId', 'opportunityId');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(Pagination);
      expect(mockQuoteModel.find).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAllTaxCredits function', () => {
    test(`should work correctly`, async () => {
      class mockTaxCreditConfigModel {
        static find = jest.fn().mockReturnValue([
          {
            toObject: jest.fn().mockReturnValue({
              name: 'name',
              percentage: 10,
              start_date: new Date('1/19/2020'),
              end_date: new Date('1/19/2020'),
            }),
          },
        ]);
        static estimatedDocumentCount = jest.fn().mockResolvedValue(1);
      }

      quoteService = new QuoteService(null, mockTaxCreditConfigModel as any, null, null, null, null, null, null);

      const res = await quoteService.getAllTaxCredits();

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(Pagination);
      expect(mockTaxCreditConfigModel.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDetailQuote function', () => {
    test('should return Entity Not Found', async () => {
      const mockQuoteModel = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      quoteService = new QuoteService(mockQuoteModel, null, null, null, null, null, null, null);
      try {
        await quoteService.getDetailQuote('quoteId');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });
  });

  describe('updateQuote function', () => {
    test('should return Entity Not Found', async () => {
      const mockQuoteModel = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      quoteService = new QuoteService(mockQuoteModel, null, null, null, null, null, null, null);
      try {
        await quoteService.updateQuote('quoteId', {} as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });

    test('should work correctly', async () => {
      const req = {
        opportunityId: 'string',
        systemDesignId: 'string',
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
            productType: FINANCE_PRODUCT_TYPE.LEASE,
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
        utilityProgramSelectedForReinvestment: true,
        taxCreditSelectedForReinvestment: true,
      } as any;

      class mockTaxCreditConfigModel {
        static findOne = jest.fn().mockReturnValue({
          toObject: jest.fn().mockReturnValue({
            name: 'name',
            percentage: 10,
            start_date: new Date('1/19/2020'),
            end_date: new Date('1/19/2020'),
          }),
        });
        static estimatedDocumentCount = jest.fn().mockResolvedValue(1);
      }

      quoteService = new QuoteService(
        MockQuoteModel as any,
        mockTaxCreditConfigModel as any,
        mockSystemDesignService,
        null,
        null,
        null,
        null,
        null,
      );

      const res = await quoteService.updateQuote('quoteId', req);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(QuoteDto);
    });
  });

  describe('calculateQuoteDetail function', () => {
    test('should work correctly without systemDesign', async () => {
      const mockSystemDesignService = { getOneById: jest.fn().mockResolvedValue(null) } as any;
      quoteService = new QuoteService(null, null, mockSystemDesignService, null, null, null, null, null);
      const res = await quoteService.calculateQuoteDetail({
        systemDesignId: 'systemDesignId',
        quoteFinanceProduct: { financeProduct: { productType: null } },
      } as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });

    test('should work correctly with FINANCE_PRODUCT_TYPE.LEASE', async () => {
      const mockSystemDesignService = {
        getOneById: jest.fn().mockResolvedValue({ cost_post_installation: { cost: [{ v: 10 }] } }),
      } as any;
      const mockCalculationService = { calculateLeaseQuote: jest.fn().mockResolvedValue({}) } as any;

      quoteService = new QuoteService(
        null,
        null,
        mockSystemDesignService,
        null,
        null,
        null,
        mockCalculationService,
        null,
      );
      const res = await quoteService.calculateQuoteDetail({
        systemDesignId: 'systemDesignId',
        quoteFinanceProduct: { financeProduct: { productType: FINANCE_PRODUCT_TYPE.LEASE } },
      } as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });

    test('should work correctly with FINANCE_PRODUCT_TYPE.LOAN', async () => {
      const mockSystemDesignService = {
        getOneById: jest.fn().mockResolvedValue({ cost_post_installation: { cost: [{ v: 10 }] } }),
      } as any;
      const mockCalculationService = { calculateLoanSolver: jest.fn().mockResolvedValue({}) } as any;

      quoteService = new QuoteService(
        null,
        null,
        mockSystemDesignService,
        null,
        null,
        null,
        mockCalculationService,
        null,
      );
      const res = await quoteService.calculateQuoteDetail({
        systemDesignId: 'systemDesignId',
        quoteFinanceProduct: { financeProduct: { productType: FINANCE_PRODUCT_TYPE.LOAN } },
      } as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });
  });

  describe('getValidationForLease function', () => {
    test('should return error with range value', async () => {
      const mockLeaseSolverConfigService = {
        getDetailByConditions: jest.fn().mockResolvedValue(null),
        getListSolverCofigsByConditions: jest.fn().mockResolvedValue([
          {
            solar_size_minimum: 10,
            solar_size_maximum: 20,
            productivity_min: 4,
            productivity_max: 6,
          },
        ]),
      } as any;

      quoteService = new QuoteService(null, null, null, null, null, null, null, mockLeaseSolverConfigService);

      try {
        const res = await quoteService.getValidationForLease({
          quoteFinanceProduct: { financeProduct: { productAttribute: { leaseTerm: 5, rateEscalator: 10 } } },
          utilityProgram: { utilityProgramName: 'utilityProgramName' },
          quoteCostBuildup: { storageQuoteDetails: [{ storageModelDataSnapshot: { sizekWh: 10 } }] },
          systemProduction: { capacityKW: 10 },
        } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
        expect(error.status).toBe(422);
      }
    });

    test('should return not found status', async () => {
      const mockLeaseSolverConfigService = {
        getDetailByConditions: jest.fn().mockResolvedValue(null),
        getListSolverCofigsByConditions: jest.fn().mockResolvedValue([]),
      } as any;

      quoteService = new QuoteService(null, null, null, null, null, null, null, mockLeaseSolverConfigService);

      try {
        const res = await quoteService.getValidationForLease({
          quoteFinanceProduct: { financeProduct: { productAttribute: { leaseTerm: 5, rateEscalator: 10 } } },
          utilityProgram: { utilityProgramName: null },
          quoteCostBuildup: { storageQuoteDetails: [{ storageModelDataSnapshot: { sizekWh: 10 } }] },
          systemProduction: { capacityKW: 10 },
        } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
        expect(error.status).toBe(404);
      }
    });
  });

  describe('getOneById function', () => {
    test('should return detailed quote schema', async () => {
      const mockQuote = {
        findById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue({ detailed_quote: {} }) }),
      } as any;

      quoteService = new QuoteService(mockQuote, null, null, null, null, null, null, null);
      const res = await quoteService.getOneById('quoteId');

      expect(res).not.toBeUndefined();
      expect(res).toBeInstanceOf(Object);
    });

    test('should return undefined', async () => {
      const mockQuote = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      quoteService = new QuoteService(mockQuote, null, null, null, null, null, null, null);
      const res = await quoteService.getOneById('quoteId');

      expect(res).toBeUndefined();
    });
  });

  describe('setOutdatedData function', () => {
    test('should work correctly', async () => {
      class MockQuoteModel2 {
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
          ...mockModelRes1,
          toObject: jest.fn().mockReturnValue(mockModelRes1),
        });

        static find = jest.fn().mockReturnValueOnce([
          {
            ...mockModelRes1,
            toObject: jest.fn().mockReturnValue(mockModelRes1),
            save: jest.fn(),
          },
        ]);
      }

      quoteService = new QuoteService(MockQuoteModel2 as any, null, null, null, null, null, null, null);
      const res = await quoteService.setOutdatedData('quoteId');
    });
  });

  describe('calculateNetCostData function', () => {
    test('should work with default value', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.calculateNetCostData(undefined, undefined, undefined);

      expect(res).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateTotalProductCost function', () => {
    test('should work with default value', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.calculateTotalProductCost({
        adderQuoteDetails: [{ cost: 10, discountDetails: [undefined], markup: 0 }],
        storageQuoteDetails: [{ cost: 10, discountDetails: [undefined], markup: 0 }],
        inverterQuoteDetails: [{ cost: 10, discountDetails: [undefined], markup: 0 }],
        panelQuoteDetails: [{ cost: 10, discountDetails: [undefined], markup: 0 }],
      });

      expect(res).toBeGreaterThanOrEqual(0);
    });

    test('should work without discountDetails ', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.calculateTotalProductCost({
        adderQuoteDetails: [{ cost: 10, markup: 0 }],
        storageQuoteDetails: [{ cost: 10, markup: 0 }],
        inverterQuoteDetails: [{ cost: 10, markup: 0 }],
        panelQuoteDetails: [{ cost: 10, markup: 0 }],
      });

      expect(res).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateIncentiveValueAmount function', () => {
    test('should unit without amount value', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.calculateIncentiveValueAmount(
        { unit: INCENTIVE_UNITS.PERCENTAGE, appliesTo: null, unitValue: 10 } as any,
        { grossPrice: 10 } as any,
      );

      expect(res).toBe(100);
    });

    test('should appliesTo with INCENTIVE_APPLIES_TO_VALUE.SOLAR', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.calculateIncentiveValueAmount(
        { unit: INCENTIVE_UNITS.PERCENTAGE, appliesTo: INCENTIVE_APPLIES_TO_VALUE.SOLAR, unitValue: 10 } as any,
        { panelQuoteDetails: [{ cost: 100, markup: 100 }] } as any,
      );
      const res1 = quoteService.calculateIncentiveValueAmount(
        { unit: INCENTIVE_UNITS.PERCENTAGE, appliesTo: INCENTIVE_APPLIES_TO_VALUE.SOLAR, unitValue: 10 } as any,
        { panelQuoteDetails: [{ cost: 100, discountDetails: [undefined], markup: 100 }] } as any,
      );
      const res2 = quoteService.calculateIncentiveValueAmount(
        { unit: INCENTIVE_UNITS.PERCENTAGE, appliesTo: INCENTIVE_APPLIES_TO_VALUE.SOLAR, unitValue: 10 } as any,
        { panelQuoteDetails: [{ cost: 100, discountDetails: [{ amount: 10 }], markup: 100 }] } as any,
      );

      expect(res).toBeGreaterThanOrEqual(0);
      expect(res1).toBeGreaterThanOrEqual(0);
      expect(res2).toBeGreaterThanOrEqual(0);
    });

    test('should appliesTo with INCENTIVE_APPLIES_TO_VALUE.STORAGE', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.calculateIncentiveValueAmount(
        { unit: INCENTIVE_UNITS.PERCENTAGE, appliesTo: INCENTIVE_APPLIES_TO_VALUE.STORAGE, unitValue: 10 } as any,
        { storageQuoteDetails: [{ cost: 100, markup: 100 }] } as any,
      );
      const res1 = quoteService.calculateIncentiveValueAmount(
        { unit: INCENTIVE_UNITS.PERCENTAGE, appliesTo: INCENTIVE_APPLIES_TO_VALUE.STORAGE, unitValue: 10 } as any,
        { storageQuoteDetails: [{ cost: 100, discountDetails: [undefined], markup: 100 }] } as any,
      );
      const res2 = quoteService.calculateIncentiveValueAmount(
        { unit: INCENTIVE_UNITS.PERCENTAGE, appliesTo: INCENTIVE_APPLIES_TO_VALUE.STORAGE, unitValue: 10 } as any,
        { storageQuoteDetails: [{ cost: 100, discountDetails: [{ amount: 10 }], markup: 100 }] } as any,
      );

      expect(res).toBeGreaterThanOrEqual(0);
      expect(res1).toBeGreaterThanOrEqual(0);
      expect(res2).toBeGreaterThanOrEqual(0);
    });

    test('should appliesTo with INCENTIVE_APPLIES_TO_VALUE.SOLAR_AND_STORAGE', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.calculateIncentiveValueAmount(
        {
          unit: INCENTIVE_UNITS.PERCENTAGE,
          appliesTo: INCENTIVE_APPLIES_TO_VALUE.SOLAR_AND_STORAGE,
          unitValue: 10,
        } as any,
        { storageQuoteDetails: [{ cost: 100, markup: 100 }], panelQuoteDetails: [{ cost: 100, markup: 100 }] } as any,
      );
      const res1 = quoteService.calculateIncentiveValueAmount(
        {
          unit: INCENTIVE_UNITS.PERCENTAGE,
          appliesTo: INCENTIVE_APPLIES_TO_VALUE.SOLAR_AND_STORAGE,
          unitValue: 10,
        } as any,
        {
          storageQuoteDetails: [{ cost: 100, discountDetails: [undefined], markup: 100 }],
          panelQuoteDetails: [{ cost: 100, discountDetails: [undefined], markup: 100 }],
        } as any,
      );
      const res2 = quoteService.calculateIncentiveValueAmount(
        {
          unit: INCENTIVE_UNITS.PERCENTAGE,
          appliesTo: INCENTIVE_APPLIES_TO_VALUE.SOLAR_AND_STORAGE,
          unitValue: 10,
        } as any,
        {
          storageQuoteDetails: [{ cost: 100, discountDetails: [{ amount: 10 }], markup: 100 }],
          panelQuoteDetails: [{ cost: 100, discountDetails: [{ amount: 10 }], markup: 100 }],
        } as any,
      );

      expect(res).toBeGreaterThanOrEqual(0);
      expect(res1).toBeGreaterThanOrEqual(0);
      expect(res2).toBeGreaterThanOrEqual(0);
    });

    test('should return error when not found appliesTo', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      try {
        const res = quoteService.calculateIncentiveValueAmount(
          {
            unit: INCENTIVE_UNITS.PERCENTAGE,
            appliesTo: INCENTIVE_APPLIES_TO_VALUE.SOLAR_AND_STORAGE.concat('123'),
            unitValue: 10,
          } as any,
          { storageQuoteDetails: [{ cost: 100, markup: 100 }], panelQuoteDetails: [{ cost: 100, markup: 100 }] } as any,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('handleUpdateQuoteFinanceProduct function', () => {
    test('should work with PROJECT_DISCOUNT_UNITS.AMOUNT', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      const res = quoteService.handleUpdateQuoteFinanceProduct(
        {
          incentiveDetails: [],
          projectDiscountDetails: [{ unit: PROJECT_DISCOUNT_UNITS.AMOUNT, unitValue: 100 }],
          rebateDetails: [],
          financeProduct: { productType: FINANCE_PRODUCT_TYPE.LOAN },
        } as any,
        {} as any,
      );

      expect(res).toEqual(expect.any(Object));
    });
  });

  describe('handleUpdateProductAttribute function', () => {
    test('should return Wrong FinanceProducts', () => {
      quoteService = new QuoteService(null, null, null, null, null, null, null, null);
      try {
        quoteService.handleUpdateProductAttribute({
          financeProduct: { productType: FINANCE_PRODUCT_TYPE.LOAN.concat('123') } as any,
          netAmount: 100,
        } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('countByOpportunityId function', () => {
    test('should return 1 ', async () => {
      const mockQuote = { countDocuments: jest.fn().mockResolvedValue(1) } as any;
      quoteService = new QuoteService(mockQuote, null, null, null, null, null, null, null);
      const res = await quoteService.countByOpportunityId('opportunityId');

      expect(res).toBe(1);
    });
  });
});
