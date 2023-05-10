import { EsaPaymentConfigService } from '../esa-payment-config.service';

describe('Esa Payment Config Service', () => {
  let esaPaymentConfigService: EsaPaymentConfigService;

  describe('getDetail function', () => {
    it('should return undefined value', async () => {
      const mockEsaPaymentConfig = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      esaPaymentConfigService = new EsaPaymentConfigService(mockEsaPaymentConfig);

      const res = await esaPaymentConfigService.getFirst();

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockEsaPaymentConfig.find).toHaveBeenCalledTimes(1);
    });

    test('should return esa payment config model', async () => {
      const mockModel = { type: 'string', config: [{ name: 'name', percentage: 'percentage' }] };
      const mockEsaPaymentConfig = {
        find: jest.fn().mockResolvedValue([mockModel]),
      } as any;

      esaPaymentConfigService = new EsaPaymentConfigService(mockEsaPaymentConfig);

      const res = await esaPaymentConfigService.getFirst();

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject(mockModel);
      expect(mockEsaPaymentConfig.find).toHaveBeenCalledTimes(1);
    });
  });
});
