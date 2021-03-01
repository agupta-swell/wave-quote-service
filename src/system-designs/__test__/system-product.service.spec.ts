import { SystemProductService } from '../sub-services';

describe('System Product Service', () => {
  let systemProductService: SystemProductService;

  describe('pvWatCalculation function', () => {
    test('should work correctly', async () => {
      const mockExternalService = { calculateSystemProduction: jest.fn().mockResolvedValue({ ac_annual: 100 }) } as any;

      systemProductService = new SystemProductService(null, mockExternalService, null);
      const res = await systemProductService.pvWatCalculation({
        lat: 0, lon: 0, systemCapacity: 0, azimuth: 0,
      });

      expect(res).toMatchSnapshot();
      expect(res).toEqual(expect.any(Number));
    });
  });

  describe('calculateSystemProductionByHour function', () => {
    test('should work correctly with pvProductionArray has one element', async () => {
      class mockPvWattSystemProduction {
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

      const mockExternalService = { calculateSystemProduction: jest.fn().mockResolvedValue({ ac: [100, 200] }) } as any;
      const mockProductService = { getDetailById: jest.fn().mockResolvedValue({ sizeW: 234 }) } as any;

      systemProductService = new SystemProductService(
        mockPvWattSystemProduction as any,
        mockExternalService,
        mockProductService,
      );
      const res = await systemProductService.calculateSystemProductionByHour({
        roofTopDesignData: {
          panelArray: [{
            panelModelId: 'panelModelId', numberOfPanels: 123, azimuth: 12, pitch: 21,
          }],
        },
      } as any);

      expect(res).toMatchSnapshot();
      expect(res).toEqual(expect.any(Array));
    });

    test('should work correctly with pvProductionArray has more than one element', async () => {
      class mockPvWattSystemProduction {
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

      const mockExternalService = { calculateSystemProduction: jest.fn().mockResolvedValue({ ac: [100, 200] }) } as any;
      const mockProductService = { getDetailById: jest.fn().mockResolvedValue({ sizeW: 234 }) } as any;

      systemProductService = new SystemProductService(
        mockPvWattSystemProduction as any,
        mockExternalService,
        mockProductService,
      );
      const res = await systemProductService.calculateSystemProductionByHour({
        roofTopDesignData: {
          panelArray: [
            {
              panelModelId: 'panelModelId', numberOfPanels: 123, azimuth: 12, pitch: 21,
            },
            {
              panelModelId: 'panelModelId', numberOfPanels: 123, azimuth: 12, pitch: 21,
            },
          ],
        },
      } as any);

      expect(res).toMatchSnapshot();
      expect(res).toEqual(expect.any(Array));
    });
  });
});
