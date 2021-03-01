import { FundingSourceService } from '../funding-source.service';

describe('Funding Source Service', () => {
  let fundingSourceService: FundingSourceService;

  describe('getDetailById function', () => {
    test('should return null ', async () => {
      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      fundingSourceService = new FundingSourceService(mockFundingSource);
      const res = await fundingSourceService.getDetailById('id');

      expect(res).toMatchSnapshot();
      expect(res).toBeNull();
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });

    test('should return funding source model', async () => {
      const mockModel = {
        _id: '_id', name: 'name', isTrancheApplicable: 'isTrancheApplicable', type: 'type',
      };
      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      fundingSourceService = new FundingSourceService(mockFundingSource);
      const res = await fundingSourceService.getDetailById('id');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toMatchObject(mockModel);
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAll function', () => {
    test('should return empty array', async () => {
      const mockFundingSource = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      fundingSourceService = new FundingSourceService(mockFundingSource);
      const res = await fundingSourceService.getAll();

      expect(res).toMatchSnapshot();
      expect(res).toHaveLength(0);
      expect(mockFundingSource.find).toHaveBeenCalledTimes(1);
    });

    test('should return funding source model array', async () => {
      const mockModel = {
        _id: '_id',
        name: 'name',
        isTrancheApplicable: 'isTrancheApplicable',
        type: 'type',
        toObject: jest
          .fn()
          .mockReturnValueOnce({
            _id: '_id', name: 'name', isTrancheApplicable: 'isTrancheApplicable', type: 'type',
          }),
      };
      const mockFundingSource = {
        find: jest.fn().mockResolvedValue([mockModel]),
      } as any;

      fundingSourceService = new FundingSourceService(mockFundingSource);
      const res = await fundingSourceService.getAll();

      expect(res).toMatchSnapshot();
      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({
        _id: '_id',
        name: 'name',
        isTrancheApplicable: 'isTrancheApplicable',
        type: 'type',
      });
      expect(mockFundingSource.find).toHaveBeenCalledTimes(1);
    });
  });
});
