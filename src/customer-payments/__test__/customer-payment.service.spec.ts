import { CustomerPaymentService } from '../customer-payment.service';

describe('Customer Payment Service', () => {
  let customerPaymentService: CustomerPaymentService;

  describe('getCustomerPaymentByOpportunityId function', () => {
    it('should return undefined value', async () => {
      const mockCustomerPayment = {
        findOne: jest.fn().mockResolvedValue(undefined),
      } as any;

      customerPaymentService = new CustomerPaymentService(mockCustomerPayment);

      const res = await customerPaymentService.getCustomerPaymentByOpportunityId('oppId');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockCustomerPayment.findOne).toHaveBeenCalledTimes(1);
    });

    test('should return Customer Payment model', async () => {
      const mockModel = {
        toObject: () => ({
          opportunityId: 'opportunityId',
          netAmount: 0,
          amount: 0,
          credit: 0,
          deposit: 0,
          payment1: 0,
          payment2: 0,
          programIncentiveDiscount: 0,
          rebate: 0,
          rebateGuaranteed: 0,
        }),
      };
      const mockCustomerPayment = {
        findOne: jest.fn().mockResolvedValue(mockModel),
      } as any;

      customerPaymentService = new CustomerPaymentService(mockCustomerPayment);

      const res = await customerPaymentService.getCustomerPaymentByOpportunityId('oppId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toBeTruthy();
      expect(res).toEqual(expect.any(Object));
      expect(mockCustomerPayment.findOne).toHaveBeenCalledTimes(1);
    });
  });
});
