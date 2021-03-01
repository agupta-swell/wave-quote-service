import { OperationResult, Pagination } from 'src/app/common';
import { ProposalSectionMasterService } from '../proposal-section-master.service';

describe('Proposal Section Master Service', () => {
  let proposalSectionMasterService: ProposalSectionMasterService;

  describe('getProposalSectionMasterById function', () => {
    test('should return null ', async () => {
      const mockProposalSectionMaster = {
        findOne: jest.fn().mockResolvedValue(null),
      } as any;

      proposalSectionMasterService = new ProposalSectionMasterService(mockProposalSectionMaster);
      const res = await proposalSectionMasterService.getProposalSectionMasterById('id');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockProposalSectionMaster.findOne).toHaveBeenCalledTimes(1);
    });

    test('should return Proposal Section Master model', async () => {
      const mockModelResponse = {
        name: 'name',
        component_name: 'componentName',
        applicable_products: ['applicableProducts'],
        applicable_financial_products: ['applicableFinancialProducts'],
      };
      const mockModel = {
        ...mockModelResponse,
        toObject: jest.fn().mockReturnValue({
          name: 'name',
          component_name: 'componentName',
          applicable_products: ['applicableProducts'],
          applicable_financial_products: ['applicableFinancialProducts'],
        }),
      };
      const mockProposalSectionMaster = {
        findOne: jest.fn().mockResolvedValue(mockModel),
      } as any;

      proposalSectionMasterService = new ProposalSectionMasterService(mockProposalSectionMaster);
      const res = await proposalSectionMasterService.getProposalSectionMasterById('id');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject(mockModelResponse);
      expect(mockProposalSectionMaster.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getList function', () => {
    test('should return Proposal Section Master array ', async () => {
      const mockProposalSectionMaster = {
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
      } as any;

      proposalSectionMasterService = new ProposalSectionMasterService(mockProposalSectionMaster);
      const res = await proposalSectionMasterService.getList(10, 0, undefined, undefined);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(Pagination);
      expect(res.data.total).toEqual(expect.any(Number));
    });
  });
});
