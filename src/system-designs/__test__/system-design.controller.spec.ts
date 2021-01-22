import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AdderConfigModule } from 'src/adder-config/adder-config.module';
import { ADDER_CONFIG } from 'src/adder-config/adder-config.schema';
import { Pagination, ServiceResponse } from 'src/app/common';
import { MyLoggerModule } from 'src/app/my-logger/my-logger.module';
import { CashPaymentConfigModule } from 'src/cash-payment-configs/cash-payment-config.module';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { FundingSourceModule } from 'src/funding-sources/funding-source.module';
import { LeaseSolverConfigModule } from 'src/lease-solver-configs/lease-solver-config.module';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductModule } from 'src/products/product.module';
import { PRODUCT } from 'src/products/product.schema';
import { QuoteModule } from 'src/quotes/quote.module';
import { UtilityModule } from 'src/utilities/utility.module';
import { UTILITY_USAGE_DETAILS } from 'src/utilities/utility.schema';
import { UtilityProgramMasterModule } from 'src/utility-programs-master/utility-program-master.module';
import { SystemDesignDto } from '../res/system-design.dto';
import { PV_WATT_SYSTEM_PRODUCTION } from '../schemas/pv-watt-system-production.schema';
import { SystemProductService } from '../sub-services';
import { SystemDesignController } from '../system-design.controller';
import { SystemDesignModule } from '../system-design.module';
import { SYSTEM_DESIGN } from '../system-design.schema';
import { SystemDesignService } from '../system-design.service';

describe('System Design Controller', () => {
  let systemDesignController: SystemDesignController;
  let systemDesignService: SystemDesignService;
  const mockSystemDesignModel = {
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
  };

  const req = {
    opportunityId: 'string',
    name: 'string',
    designMode: 'roofTop',
    latitude: 0,
    longtitude: 0,
    thumbnail: null,
    roofTopDesignData: {
      panelArray: [
        {
          primaryOrientationSide: 0,
          panelOrientation: 'Landscape',
          boundPolygon: [
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
          setbacksPolygon: [
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
          rowSpacing: 0,
          panelModelId: 'string',
          numberOfPanels: 0,
        },
      ],
      inverters: [
        {
          id: 'string',
          type: 'central',
          inverterModelId: 'string',
          inverterModelDataSnapshot: {
            name: 'string',
            type: 'string',
            price: 0,
            sizeW: 0,
            sizekWh: 0,
            partNumber: ['string'],
          },
          inverterModelSnapshotDate: '2021-01-19T00:24:27.754Z',
        },
      ],
      storage: [
        {
          id: 'string',
          type: 'BACKUP_POWER',
          storageModelId: 'string',
          quantity: 0,
          storageModelDataSnapshot: {
            name: 'string',
            type: 'string',
            price: 0,
            sizeW: 0,
            sizekWh: 0,
            partNumber: ['string'],
          },
          storageModelSnapshotDate: '2021-01-19T00:24:27.754Z',
        },
      ],
      adders: [
        {
          id: 'string',
          type: 'BACKUP_POWER',
          storageModelId: 'string',
          quantity: 0,
          storageModelDataSnapshot: {
            name: 'string',
            type: 'string',
            price: 0,
            sizeW: 0,
            sizekWh: 0,
            partNumber: ['string'],
          },
          storageModelSnapshotDate: '2021-01-19T00:24:27.754Z',
        },
      ],
    },
    capacityProductionDesignData: {
      capacity: 0,
      production: 0,
      numberOfPanels: 0,
      panelModelId: 0,
      inverters: [
        {
          id: 'string',
          type: 'central',
          inverterModelId: 'string',
          inverterModelDataSnapshot: {
            name: 'string',
            type: 'string',
            price: 0,
            sizeW: 0,
            sizekWh: 0,
            partNumber: ['string'],
          },
          inverterModelSnapshotDate: '2021-01-19T00:24:27.754Z',
        },
      ],
      storage: [
        {
          id: 'string',
          type: 'BACKUP_POWER',
          storageModelId: 'string',
          quantity: 0,
          storageModelDataSnapshot: {
            name: 'string',
            type: 'string',
            price: 0,
            sizeW: 0,
            sizekWh: 0,
            partNumber: ['string'],
          },
          storageModelSnapshotDate: '2021-01-19T00:24:27.755Z',
        },
      ],
    },
    isSelected: true,
    isSolar: true,
    isRetrofit: true,
  };

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            ...mockSystemDesignModel,
            toObject: jest.fn().mockReturnValue(mockSystemDesignModel),
          },
        ]),
      }),
    }),
    findById: jest.fn().mockResolvedValue({
      ...mockSystemDesignModel,
      toObject: jest.fn().mockReturnValue(mockSystemDesignModel),
    }),
    findOne: jest.fn().mockResolvedValue({
      ...mockSystemDesignModel,
      deleteOne: jest.fn(),
    }),
    estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        SystemDesignModule,
        ProductModule,
        UtilityModule,
        AdderConfigModule,
        QuoteModule,
        ExternalServiceModule,
        MyLoggerModule,
        UtilityProgramMasterModule,
        FundingSourceModule,
        CashPaymentConfigModule,
        LeaseSolverConfigModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
        OpportunityModule,
      ],
    })
      .overrideProvider(getModelToken(SYSTEM_DESIGN))
      .useValue(mockRepository)
      .compile();

    systemDesignService = moduleRef.get<SystemDesignService>(SystemDesignService);
    systemDesignController = moduleRef.get<SystemDesignController>(SystemDesignController);
  });

  test('should getList work correctly', async () => {
    const res = await systemDesignController.getsystemDesigns('100', '0', '-1', 'opportunityId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.total).toEqual(expect.any(Number));
  });

  test('should getDetails work correctly', async () => {
    const res = await systemDesignController.getDetails('systemDesignId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(SystemDesignDto);
  });

  test('should delete work correctly', async () => {
    const res = await systemDesignController.delete('systemDesignId', 'opportunityId');

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toEqual(expect.any(String));
  });

  test('should create work correctly', async () => {
    class MockRespository {
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
      static find = jest.fn().mockReturnValueOnce({
        limit: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce([
            {
              ...mockSystemDesignModel,
              toObject: jest.fn().mockReturnValue(mockSystemDesignModel),
            },
          ]),
        }),
      });

      static findById = jest.fn().mockResolvedValue({
        ...mockSystemDesignModel,
        toObject: jest.fn().mockReturnValue(mockSystemDesignModel),
      });
      static findOne = jest.fn().mockResolvedValue({
        ...mockSystemDesignModel,
        deleteOne: jest.fn(),
      });
      static estimatedDocumentCount = jest.fn().mockReturnValueOnce(1);
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        SystemDesignModule,
        ProductModule,
        UtilityModule,
        AdderConfigModule,
        QuoteModule,
        ExternalServiceModule,
        MyLoggerModule,
        UtilityProgramMasterModule,
        FundingSourceModule,
        CashPaymentConfigModule,
        LeaseSolverConfigModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
        OpportunityModule,
      ],
    })
      .overrideProvider(getModelToken(SYSTEM_DESIGN))
      .useValue(MockRespository)
      .overrideProvider(getModelToken(PRODUCT))
      .useValue({ findById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue({}) }) })
      .overrideProvider(getModelToken(ADDER_CONFIG))
      .useValue({
        findById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue({ modifiedAt: '21/01/2021' }) }),
      })
      .overrideProvider(getModelToken(PV_WATT_SYSTEM_PRODUCTION))
      .useValue({
        findOne: jest.fn().mockResolvedValue({ ac_annual_hourly_production: [1, 2, 3] }),
      })
      .overrideProvider(getModelToken(UTILITY_USAGE_DETAILS))
      .useValue({
        findOne: jest.fn().mockResolvedValue({
          utility_data: {
            actual_usage: { hourly_usage: [{ i: 1, v: 2 }] },
            typical_baseline_usage: { zip_code: 123123 },
          },
          cost_data: { master_tariff_id: '123' },
        }),
      })
      .compile();

    const systemProductService = moduleRef.get<SystemProductService>(SystemProductService);
    jest.spyOn(systemProductService, 'pvWatCalculation').mockImplementation(async () => 6);

    const res = await moduleRef.get<SystemDesignController>(SystemDesignController).create(req as any);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(SystemDesignDto);
  });

  test('should update work correctly', async () => {
    class MockRespository {
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
      static find = jest.fn().mockReturnValueOnce({
        limit: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce([
            {
              ...mockSystemDesignModel,
              toObject: jest.fn().mockReturnValue(mockSystemDesignModel),
            },
          ]),
        }),
      });

      static findById = jest.fn().mockResolvedValue({
        ...mockSystemDesignModel,
        toObject: jest.fn().mockReturnValue(mockSystemDesignModel),
        updateOne: jest.fn().mockReturnValue(mockSystemDesignModel),
      });
      static findOne = jest.fn().mockResolvedValue({
        ...mockSystemDesignModel,
        deleteOne: jest.fn(),
      });
      static estimatedDocumentCount = jest.fn().mockReturnValueOnce(1);
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        SystemDesignModule,
        ProductModule,
        UtilityModule,
        AdderConfigModule,
        QuoteModule,
        ExternalServiceModule,
        MyLoggerModule,
        UtilityProgramMasterModule,
        FundingSourceModule,
        CashPaymentConfigModule,
        LeaseSolverConfigModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
        OpportunityModule,
      ],
    })
      .overrideProvider(getModelToken(SYSTEM_DESIGN))
      .useValue(MockRespository)
      .overrideProvider(getModelToken(PRODUCT))
      .useValue({ findById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue({}) }) })
      .overrideProvider(getModelToken(ADDER_CONFIG))
      .useValue({
        findById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockReturnValue({ modifiedAt: '21/01/2021' }) }),
      })
      .overrideProvider(getModelToken(PV_WATT_SYSTEM_PRODUCTION))
      .useValue({
        findOne: jest.fn().mockResolvedValue({ ac_annual_hourly_production: [1, 2, 3] }),
      })
      .overrideProvider(getModelToken(UTILITY_USAGE_DETAILS))
      .useValue({
        findOne: jest.fn().mockResolvedValue({
          utility_data: {
            actual_usage: { hourly_usage: [{ i: 1, v: 2 }] },
            typical_baseline_usage: { zip_code: 123123 },
          },
          cost_data: { master_tariff_id: '123' },
        }),
      })
      .compile();

    const systemProductService = moduleRef.get<SystemProductService>(SystemProductService);
    jest.spyOn(systemProductService, 'pvWatCalculation').mockImplementation(async () => 6);

    const res = await moduleRef
      .get<SystemDesignController>(SystemDesignController)
      .update('systemDesignId', req as any);

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(SystemDesignDto);
  });
});
