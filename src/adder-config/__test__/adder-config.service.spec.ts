import { AdderConfigService } from '../adder-config.service';

describe('Adder Config Service', () => {
  let adderConfigService: AdderConfigService;

  describe('getAdderConfigDetail function', () => {
    test('should return undefined ', async () => {
      const mockAdderConfig = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      adderConfigService = new AdderConfigService(mockAdderConfig);
      const res = await adderConfigService.getAdderConfigDetail('id');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockAdderConfig.findById).toHaveBeenCalledTimes(1);
    });

    test('should return adder config model', async () => {
      const mockResponse = {
        _id: '_id',
        adder: 'adder',
        price: 1000,
        increment: 'string',
        modifiedAt: Date,
      };
      const mockModel = {
        ...mockResponse,
        toObject: () => ({
          _id: '_id',
          adder: 'adder',
          price: 1000,
          increment: 'string',
          modifiedAt: Date,
        }),
      };
      const mockAdderConfig = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      adderConfigService = new AdderConfigService(mockAdderConfig);
      const res = await adderConfigService.getAdderConfigDetail('id');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject(mockResponse);
      expect(mockAdderConfig.findById).toHaveBeenCalledTimes(1);
    });
  });
});
