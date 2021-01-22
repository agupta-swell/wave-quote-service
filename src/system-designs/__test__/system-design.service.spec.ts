import { OperationResult } from 'src/app/common';
import { SystemDesignDto } from '../res/system-design.dto';
import { SystemDesignService } from '../system-design.service';

describe('System Design Service', () => {
  let systemDesignService: SystemDesignService;

  describe('create function', () => {
    test(`should return error `, async () => {
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
            typical_baseline_usage: { zip_code: 123 },
          },
          cost_data: { master_tariff_id: '123' },
        }),
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
        designMode: 'capacityProduction',
      } as any);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SystemDesignDto);
    });
  });

  // describe('getList function', () => {
  //   test(`should return System Design array `, async () => {
  //     const mockProposalSectionMaster = {
  //       find: jest.fn().mockReturnValueOnce({
  //         limit: jest.fn().mockReturnValueOnce({
  //           skip: jest.fn().mockReturnValueOnce([
  //             {
  //               name: 'name',
  //               component_name: 'componentName',
  //               applicable_products: ['applicableProducts'],
  //               applicable_financial_products: ['applicableFinancialProducts'],
  //               toObject: jest.fn().mockReturnValue({
  //                 name: 'name',
  //                 component_name: 'componentName',
  //                 applicable_products: ['applicableProducts'],
  //                 applicable_financial_products: ['applicableFinancialProducts'],
  //               }),
  //             },
  //           ]),
  //         }),
  //       }),
  //       countDocuments: jest.fn().mockReturnValueOnce(1),
  //     } as any;

  //     proposalSectionMasterService = new SystemDesignService(mockProposalSectionMaster);
  //     const res = await proposalSectionMasterService.getList(10, 0, undefined, undefined);

  //     expect(res).toMatchSnapshot();
  //     expect(res).toBeInstanceOf(OperationResult);
  //     expect(res.data).toBeInstanceOf(Pagination);
  //     expect(res.data.total).toEqual(expect.any(Number));
  //   });
  // });
});
