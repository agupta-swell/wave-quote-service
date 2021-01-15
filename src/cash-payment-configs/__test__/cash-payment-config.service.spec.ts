import { CashPaymentConfigService } from '../cash-payment-config.service';

describe('Cash Payment Config Service', () => {
  let cashPaymentConfigService: CashPaymentConfigService;

  describe('getDetail function', () => {
    it(`should return undefined value`, async () => {
      const mockCashPaymentConfig = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      cashPaymentConfigService = new CashPaymentConfigService(mockCashPaymentConfig);

      const res = await cashPaymentConfigService.getFirst();

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockCashPaymentConfig.find).toHaveBeenCalledTimes(1);
    });

    test('should return cash payment config model', async () => {
      const mockModel = { type: 'string', config: [{ name: 'name', percentage: 'percentage' }] };
      const mockCashPaymentConfig = {
        find: jest.fn().mockResolvedValue([mockModel]),
      } as any;

      cashPaymentConfigService = new CashPaymentConfigService(mockCashPaymentConfig);

      const res = await cashPaymentConfigService.getFirst();

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject(mockModel);
      expect(mockCashPaymentConfig.find).toHaveBeenCalledTimes(1);
    });
  });
});
