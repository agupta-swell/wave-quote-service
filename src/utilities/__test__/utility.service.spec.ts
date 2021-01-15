import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { CALCULATION_MODE } from '../constants';
import { UtilityService } from '../utility.service';

describe('Utility Service', () => {
  let utilityService: UtilityService;

  describe('getTypicalBaseline function', () => {
    test(`should return null `, async () => {
      const mockExternalService = {
        getTypicalBaseLine: jest.fn().mockResolvedValue({ zipCode: 123, lseId: 'lseId' }),
      };

      class mockGenabilityUsageDataModel {
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

      utilityService = new UtilityService(
        mockGenabilityUsageDataModel as any,
        null,
        null,
        null,
        mockExternalService as any,
        null,
        null,
      );
      const res = await utilityService.getTypicalBaseline(123);
      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(mockGenabilityUsageDataModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTariffs function', () => {
    test('should getTariffs return error', async () => {
      const mockExternalService = {
        getTariff: jest.fn().mockResolvedValue([]),
      };

      utilityService = new UtilityService(null, null, null, null, mockExternalService as any, null, null);
      const res = await utilityService.getTariffs(123, 123);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
    });
  });

  describe('createUtilityUsageDetail function', () => {
    test('should work correctly', async () => {
      const mockExternalService = {
        getTypicalBaseLine: jest.fn().mockResolvedValue({ zipCode: 123, lseId: 'lseId' }),
      };

      class mockUtilityUsageDetailModel {
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

      class mockGenabilityUsageDataModel {
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

      utilityService = new UtilityService(
        mockGenabilityUsageDataModel as any,
        null,
        null,
        mockUtilityUsageDetailModel as any,
        mockExternalService as any,
        null,
        null,
      );

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
      const res = await utilityService.createUtilityUsageDetail(req as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(mockUtilityUsageDetailModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUtilityUsageDetail function', () => {
    test('should work correctly', async () => {
      const mockExternalService = {
        getTypicalBaseLine: jest.fn().mockResolvedValue({ zipCode: 123, lseId: 'lseId' }),
      };

      class mockUtilityUsageDetailModel {
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

      utilityService = new UtilityService(
        null,
        null,
        null,
        mockUtilityUsageDetailModel as any,
        mockExternalService as any,
        null,
        null,
      );

      const res = await utilityService.getUtilityUsageDetail('oppId');

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(mockUtilityUsageDetailModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUtilityUsageDetail function', () => {
    test('should failure and return SyncSystemDesignFail', async () => {
      const mockExternalService = {
        getTypicalBaseLine: jest.fn().mockResolvedValue({ zipCode: 123, lseId: 'lseId' }),
      };
      const mockSystemDesignService = {
        updateListSystemDesign: jest.fn().mockResolvedValue(false),
      };
      const mockQuoteService = {
        setOutdatedData: jest.fn(),
      };

      class mockUtilityUsageDetailModel {
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
        static findByIdAndUpdate = jest.fn().mockResolvedValue(null);
        static findOne = jest.fn().mockResolvedValue(null);
      }

      class mockGenabilityUsageDataModel {
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
        static findByIdAndUpdate = jest.fn().mockResolvedValue(null);
        static findOne = jest.fn().mockResolvedValue(null);
      }

      utilityService = new UtilityService(
        mockGenabilityUsageDataModel as any,
        null,
        null,
        mockUtilityUsageDetailModel as any,
        mockExternalService as any,
        mockSystemDesignService as any,
        mockQuoteService as any,
      );
      try {
        await utilityService.updateUtilityUsageDetail('oppId', {
          utilityData: { typicalBaselineUsage: { zipCode: 10 }, actualUsage: { monthlyUsage: [] } },
          opportunityId: '123123123',
        } as any);
      } catch (error) {
        expect(error).toMatchSnapshot();
        expect(error).toBeInstanceOf(ApplicationException);
        expect(mockSystemDesignService.updateListSystemDesign).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('calculateCost function', () => {
    test('should work correctly', async () => {
      const mockExternalService = {
        getTypicalBaseLine: jest.fn().mockResolvedValue({ zipCode: 123, lseId: 'lseId' }),
        calculateCost: jest.fn().mockResolvedValue([[{ items: [{ fromDateTime: '12/25/2020' }] }]]),
      };

      class mockGenabilityCostDataModel {
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

      utilityService = new UtilityService(
        null,
        null,
        mockGenabilityCostDataModel as any,
        null,
        mockExternalService as any,
        null,
        null,
      );

      const res = await utilityService.calculateCost([], '123', CALCULATION_MODE.TYPICAL);

      expect(res).toMatchSnapshot();
      expect(res).toEqual(expect.any(Object));
      expect(mockGenabilityCostDataModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockExternalService.calculateCost).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMonth function', () => {
    test('should return -1', () => {
      utilityService = new UtilityService(null, null, null, null, null, null, null);
      const res = utilityService.getMonth(8761);

      expect(res).toBe(-1);
    });
  });

  describe('getUtilityByOpportunityId function', () => {
    test('should return null', async () => {
      class mockUtilityUsageDetailModel {
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

      utilityService = new UtilityService(null, null, null, mockUtilityUsageDetailModel as any, null, null, null);
      const res = await utilityService.getUtilityByOpportunityId('oppId');

      expect(res).toMatchSnapshot();
      expect(res).toBeNull();
      expect(mockUtilityUsageDetailModel.findOne).toHaveBeenCalledTimes(1);
    });

    test('should return utility model', async () => {
      class mockUtilityUsageDetailModel {
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
        static findOne = jest
          .fn()
          .mockResolvedValue({ opportunity_id: 'opportunity_id', utility_data: {}, cost_data: {} });
      }

      utilityService = new UtilityService(null, null, null, mockUtilityUsageDetailModel as any, null, null, null);
      const res = await utilityService.getUtilityByOpportunityId('oppId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toEqual(expect.any(Object));
      expect(mockUtilityUsageDetailModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUtilityName function', () => {
    test('should return emptry string', async () => {
      class mockUtilitiesModelModel {
        static findById = jest.fn().mockResolvedValue(null);
      }

      utilityService = new UtilityService(null, mockUtilitiesModelModel as any, null, null, null, null, null);
      const res = await utilityService.getUtilityName('oppId');

      console.log('>>>>>>>>>>>>>>>>>>>', 'ressss', res);
      expect(res).toMatchSnapshot();
      expect(res).toBe('');
      expect(mockUtilitiesModelModel.findById).toHaveBeenCalledTimes(1);
    });

    test('should return name', async () => {
      class mockUtilitiesModelModel {
        static findById = jest.fn().mockResolvedValue({ name: 'name' });
      }

      utilityService = new UtilityService(null, mockUtilitiesModelModel as any, null, null, null, null, null);
      const res = await utilityService.getUtilityName('oppId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBe('');
      expect(res).toBeTruthy();
      expect(mockUtilitiesModelModel.findById).toHaveBeenCalledTimes(1);
    });
  });
});
