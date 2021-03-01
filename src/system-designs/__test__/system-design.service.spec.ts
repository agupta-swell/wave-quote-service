import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { SystemDesignDto } from '../res/system-design.dto';
import { SystemDesignService } from '../system-design.service';
import { DESIGN_MODE } from '../constants';

describe('System Design Service', () => {
  let systemDesignService: SystemDesignService;

  describe('create function', () => {
    test('should return error ', async () => {
      systemDesignService = new SystemDesignService(null, null, null, null, null, null, null);
      try {
        await systemDesignService.create({} as any);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should return System Design model', async () => {
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue({
          utility_data: {
            actual_usage: {
              hourly_usage: [{ v: 12 }],
            },
            typical_baseline_usage: { zip_code: 123, annual_consumption: 123 },
          },
          cost_data: { master_tariff_id: '123' },
        }),
        calculateCost: jest.fn(),
      } as any;
      const mockSystemProductService = {
        calculateSystemProductionByHour: jest.fn().mockResolvedValue({}),
        calculateNetUsagePostSystemInstallation: jest.fn().mockResolvedValue({}),
        pvWatCalculation: jest.fn().mockResolvedValue(123),
      } as any;
      const mockUploadImageService = { uploadToAWSS3: jest.fn().mockResolvedValue('URL_LINK') } as any;
      const mockProductService = {
        getDetailById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockResolvedValue({}) }),
      } as any;
      const mockAdderConfigService = { getAdderConfigDetail: jest.fn().mockResolvedValue({}) } as any;
      class MockSystemDesign {
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
      }

      systemDesignService = new SystemDesignService(
        MockSystemDesign as any,
        mockProductService,
        mockSystemProductService,
        mockUploadImageService,
        mockUtilityService,
        mockAdderConfigService,
        null,
      );

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

      const res = await systemDesignService.create(req as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SystemDesignDto);
    });

    test('should return System Design model without Utility', async () => {
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue(null),
        calculateCost: jest.fn(),
      } as any;
      const mockSystemProductService = {
        calculateSystemProductionByHour: jest.fn().mockResolvedValue({}),
        calculateNetUsagePostSystemInstallation: jest.fn().mockResolvedValue({}),
        pvWatCalculation: jest.fn().mockResolvedValue(123),
      } as any;
      const mockUploadImageService = { uploadToAWSS3: jest.fn().mockResolvedValue('URL_LINK') } as any;
      const mockProductService = {
        getDetailById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockResolvedValue({}) }),
      } as any;
      const mockAdderConfigService = { getAdderConfigDetail: jest.fn().mockResolvedValue({}) } as any;
      class MockSystemDesign {
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
      }

      systemDesignService = new SystemDesignService(
        MockSystemDesign as any,
        mockProductService,
        mockSystemProductService,
        mockUploadImageService,
        mockUtilityService,
        mockAdderConfigService,
        null,
      );

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

      const res = await systemDesignService.create(req as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SystemDesignDto);
    });

    test('should return System Design model with CAPACITY_PRODUCTION MODE', async () => {
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue(null),
        calculateCost: jest.fn(),
      } as any;
      const mockSystemProductService = {
        calculateSystemProductionByHour: jest.fn().mockResolvedValue({}),
        calculateNetUsagePostSystemInstallation: jest.fn().mockResolvedValue({}),
      } as any;

      class MockSystemDesign {
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
      }

      systemDesignService = new SystemDesignService(
        MockSystemDesign as any,
        null,
        mockSystemProductService,
        null,
        mockUtilityService,
        null,
        null,
      );
      const res = await systemDesignService.create({
        capacityProductionDesignData: {},
        designMode: DESIGN_MODE.CAPACITY_PRODUCTION,
      } as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SystemDesignDto);
    });
  });

  describe('update function', () => {
    test('should return Entity Not Found ', async () => {
      const mockSystemDesignModel = { findById: jest.fn().mockResolvedValue(null) } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel, null, null, null, null, null, null);
      try {
        const res = await systemDesignService.update('1', {} as any);
      } catch (error) {
        expect(error).toMatchSnapshot();
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });

    test('should update successfully', async () => {
      const mockSystemDesignModel = {
        findById: jest
          .fn()
          .mockResolvedValue({ updateOne: jest.fn().mockResolvedValue({ toObject: jest.fn() }), toObject: jest.fn() }),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel, null, null, null, null, null, null);
      const res = await systemDesignService.update('1', {} as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });

    test('should update successfully without Utility model', async () => {
      const mockSystemDesignModel = {
        findById: jest
          .fn()
          .mockResolvedValue({ updateOne: jest.fn().mockResolvedValue({ toObject: jest.fn() }), toObject: jest.fn() }),
      } as any;
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue(null),
        calculateCost: jest.fn(),
      } as any;
      const mockSystemProductService = {
        calculateSystemProductionByHour: jest.fn().mockResolvedValue({}),
        calculateNetUsagePostSystemInstallation: jest.fn().mockResolvedValue({}),
        pvWatCalculation: jest.fn().mockResolvedValue(123),
      } as any;
      const mockUploadImageService = { uploadToAWSS3: jest.fn().mockResolvedValue('URL_LINK') } as any;
      const mockProductService = {
        getDetailById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockResolvedValue({}) }),
      } as any;
      const mockAdderConfigService = { getAdderConfigDetail: jest.fn().mockResolvedValue({}) } as any;
      const mockQuoteService = { setOutdatedData: jest.fn() } as any;

      systemDesignService = new SystemDesignService(
        mockSystemDesignModel,
        mockProductService,
        mockSystemProductService,
        mockUploadImageService,
        mockUtilityService,
        mockAdderConfigService,
        mockQuoteService,
      );
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

      const res = await systemDesignService.update('1', req as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });

    test('should update successfully with Utility model', async () => {
      const mockSystemDesignModel = {
        findById: jest
          .fn()
          .mockResolvedValue({ updateOne: jest.fn().mockResolvedValue({ toObject: jest.fn() }), toObject: jest.fn() }),
      } as any;
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue({
          utility_data: {
            actual_usage: {
              hourly_usage: [{ v: 12 }],
            },
            typical_baseline_usage: { zip_code: 123, annual_consumption: 123 },
          },
          cost_data: { master_tariff_id: '123' },
        }),
        calculateCost: jest.fn(),
      } as any;
      const mockSystemProductService = {
        calculateSystemProductionByHour: jest.fn().mockResolvedValue({}),
        calculateNetUsagePostSystemInstallation: jest.fn().mockResolvedValue({}),
        pvWatCalculation: jest.fn().mockResolvedValue(123),
      } as any;
      const mockUploadImageService = { uploadToAWSS3: jest.fn().mockResolvedValue('URL_LINK') } as any;
      const mockProductService = {
        getDetailById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockResolvedValue({}) }),
      } as any;
      const mockAdderConfigService = { getAdderConfigDetail: jest.fn().mockResolvedValue({}) } as any;
      const mockQuoteService = { setOutdatedData: jest.fn() } as any;

      systemDesignService = new SystemDesignService(
        mockSystemDesignModel,
        mockProductService,
        mockSystemProductService,
        mockUploadImageService,
        mockUtilityService,
        mockAdderConfigService,
        mockQuoteService,
      );
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

      const res = await systemDesignService.update('1', req as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });

    test('should update successfully without RoofTopDeisgn', async () => {
      const mockSystemDesignModel = {
        findById: jest
          .fn()
          .mockResolvedValue({ updateOne: jest.fn().mockResolvedValue({ toObject: jest.fn() }), toObject: jest.fn() }),
      } as any;
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue({
          utility_data: {
            actual_usage: {
              hourly_usage: [{ v: 12 }],
            },
            typical_baseline_usage: { zip_code: 123, annual_consumption: 123 },
          },
          cost_data: { master_tariff_id: '123' },
        }),
        calculateCost: jest.fn(),
      } as any;
      const mockSystemProductService = {
        calculateSystemProductionByHour: jest.fn().mockResolvedValue({}),
        calculateNetUsagePostSystemInstallation: jest.fn().mockResolvedValue({}),
        pvWatCalculation: jest.fn().mockResolvedValue(123),
      } as any;
      const mockUploadImageService = { uploadToAWSS3: jest.fn().mockResolvedValue('URL_LINK') } as any;
      const mockProductService = {
        getDetailById: jest.fn().mockResolvedValue({ toObject: jest.fn().mockResolvedValue({}) }),
      } as any;
      const mockAdderConfigService = { getAdderConfigDetail: jest.fn().mockResolvedValue({}) } as any;
      const mockQuoteService = { setOutdatedData: jest.fn() } as any;

      systemDesignService = new SystemDesignService(
        mockSystemDesignModel,
        mockProductService,
        mockSystemProductService,
        mockUploadImageService,
        mockUtilityService,
        mockAdderConfigService,
        mockQuoteService,
      );
      const req = {
        opportunityId: 'string',
        name: 'string',
        designMode: 'roofTop',
        latitude: 0,
        longtitude: 0,
        thumbnail: null,
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

      const res = await systemDesignService.update('1', req as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });
  });

  describe('delete function', () => {
    test('should return Entity Not Found', async () => {
      const mockSystemDesignModel = { findOne: jest.fn().mockResolvedValue(null) };
      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);

      try {
        await systemDesignService.delete('systemDesignId', 'opportunityId');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });
  });

  describe('getAllSystemDesigns function', () => {
    test('should cover selected is undefined', async () => {
      const mockSystemDesignModel = {
        find: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce([
              {
                _id: '_id',
                toObject: jest.fn().mockReturnValue({ _id: '_id' }),
              },
            ]),
          }),
        }),
        estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
      };
      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);

      const res = await systemDesignService.getAllSystemDesigns(10, 0, undefined, '123');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(Pagination);
      expect(res.data.data).toEqual(expect.arrayContaining(Array<SystemDesignDto>()));
    });

    test('should cover selected is \'0\'', async () => {
      const mockSystemDesignModel = {
        find: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce([
              {
                _id: '_id',
                toObject: jest.fn().mockReturnValue({ _id: '_id' }),
              },
            ]),
          }),
        }),
        estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
      };
      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);

      const res = await systemDesignService.getAllSystemDesigns(10, 0, '0', '123');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(Pagination);
      expect(res.data.data).toEqual(expect.arrayContaining(Array<SystemDesignDto>()));
    });

    test('should cover selected is \'1\'', async () => {
      const mockSystemDesignModel = {
        find: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce([
              {
                _id: '_id',
                toObject: jest.fn().mockReturnValue({ _id: '_id' }),
              },
            ]),
          }),
        }),
        estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
      };
      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);

      const res = await systemDesignService.getAllSystemDesigns(10, 0, '1', '123');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(Pagination);
      expect(res.data.data).toEqual(expect.arrayContaining(Array<SystemDesignDto>()));
    });

    test('should cover selected is \'2\'', async () => {
      const mockSystemDesignModel = {
        find: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce([
              {
                _id: '_id',
                toObject: jest.fn().mockReturnValue({ _id: '_id' }),
              },
            ]),
          }),
        }),
        estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
      };
      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);

      const res = await systemDesignService.getAllSystemDesigns(10, 0, '2', '123');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(Pagination);
      expect(res.data.data).toEqual(expect.arrayContaining(Array<SystemDesignDto>()));
    });
  });

  describe('getDetails function', () => {
    test('should return Entity Not Found', async () => {
      try {
        const mockSystemDesignModel = {
          findById: jest.fn().mockResolvedValue(null),
        };
        systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);

        await systemDesignService.getDetails('SystemDesignId');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });
  });

  describe('getOneById function', () => {
    test('should return undefined ', async () => {
      const mockSystemDesignModel = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);
      const res = await systemDesignService.getOneById('id');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockSystemDesignModel.findById).toHaveBeenCalledTimes(1);
    });

    test('should return system design model', async () => {
      const mockResponse = {
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
      const mockModel = {
        ...mockResponse,
        toObject: () => mockResponse,
      };
      const mockSystemDesignModel = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);
      const res = await systemDesignService.getOneById('id');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject(mockResponse);
      expect(mockSystemDesignModel.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRoofTopDesignById function', () => {
    test('should return undefined ', async () => {
      const mockSystemDesignModel = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);
      const res = await systemDesignService.getRoofTopDesignById('id');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockSystemDesignModel.findById).toHaveBeenCalledTimes(1);
    });

    test('should return system design model', async () => {
      const mockResponse = {
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
      const mockModel = {
        ...mockResponse,
        toObject: () => mockResponse,
      };
      const mockSystemDesignModel = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);
      const res = await systemDesignService.getRoofTopDesignById('id');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject(mockResponse.roof_top_design_data);
      expect(mockSystemDesignModel.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateListSystemDesign function', () => {
    test('should work correctly', async () => {
      const mockSystemDesignModel = {
        find: jest.fn().mockResolvedValue([
          {
            system_production_data: {
              annual_usageKWh: 109,
              offset_percentage: 10,
            },
            updateOne: jest.fn(),
            toObject: jest.fn(),
          },
        ]),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);
      const res = await systemDesignService.updateListSystemDesign('id', 100);

      expect(res).toMatchSnapshot();
      expect(res).toBe(true);
    });

    test('should return false', async () => {
      const mockSystemDesignModel = {
        find: jest.fn().mockResolvedValue([
          {
            system_production_data: {
              annual_usageKWh: 109,
              offset_percentage: 10,
            },
            updateOne: jest.fn().mockRejectedValue({}),
            toObject: jest.fn(),
          },
        ]),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);
      const res = await systemDesignService.updateListSystemDesign('id', 0);

      expect(res).toMatchSnapshot();
      expect(res).toBe(false);
    });
  });

  describe('countByOpportunityId function', () => {
    test('should work correctly', async () => {
      const mockSystemDesignModel = {
        countDocuments: jest.fn().mockResolvedValue(1),
      } as any;

      systemDesignService = new SystemDesignService(mockSystemDesignModel as any, null, null, null, null, null, null);
      const res = await systemDesignService.countByOpportunityId('id');

      expect(res).toMatchSnapshot();
      expect(res).toEqual(expect.any(Number));
    });
  });
});
