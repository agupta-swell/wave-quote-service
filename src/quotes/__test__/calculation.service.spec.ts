import { ApplicationException } from 'src/app/app.exception';
import { CalculationService } from 'src/quotes/sub-services';

describe('Calculation Service in Quotes', () => {
  let calculationService: CalculationService;

  describe('calculateLeaseQuote function', () => {
    test('should work correctly', async () => {
      const mockLeaseSolverConfigService = {
        getDetailByConditions: jest.fn().mockResolvedValue({
          solar_size_minimum: 10,
          solar_size_maximum: 20,
          productivity_min: 4,
          productivity_max: 6,
        }),
      } as any;
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue({
          cost_data: { typical_usage_cost: { cost: [{ v: 100 }] } },
        }),
      } as any;

      calculationService = new CalculationService(mockUtilityService, mockLeaseSolverConfigService);
      const res = await calculationService.calculateLeaseQuote(
        {
          opportunityId: 'opportunityId',
          quoteFinanceProduct: { financeProduct: { productAttribute: { leaseAmount: 100, leaseTerm: 12 } } },
          quoteCostBuildup: { grossPrice: 101, storageQuoteDetails: [{ storageModelDataSnapshot: { sizekWh: 30 } }] },
          isSolar: true,
          isRetrofit: true,
          utilityProgram: {},
          systemProduction: {
            capacityKW: 10,
            productivity: 122,
          },
        } as any,
        19,
      );

      expect(res).toEqual(expect.any(Object));
    });

    test('should return leaseSolverConfig not found', async () => {
      const mockLeaseSolverConfigService = {
        getDetailByConditions: jest.fn().mockResolvedValue(null),
      } as any;
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue({
          cost_data: { typical_usage_cost: { cost: [{ v: 100 }] } },
        }),
      } as any;

      calculationService = new CalculationService(mockUtilityService, mockLeaseSolverConfigService);
      try {
        const res = await calculationService.calculateLeaseQuote(
          {
            opportunityId: 'opportunityId',
            quoteFinanceProduct: { financeProduct: { productAttribute: { leaseAmount: 100 } } },
            quoteCostBuildup: {
              grossPrice: 101,
              storageQuoteDetails: [{ storageModelDataSnapshot: { sizekWh: 30 } }],
            },
            isSolar: true,
            isRetrofit: true,
            utilityProgram: {},
            systemProduction: {
              capacityKW: 10,
              productivity: 122,
            },
          } as any,
          19,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });
  });

  describe('calculateLoanSolver function', () => {
    test('should work correctly', async () => {
      const mockUtilityService = {
        getUtilityByOpportunityId: jest.fn().mockResolvedValue({
          cost_data: { typical_usage_cost: { cost: [{ v: 100 }] } },
        }),
      } as any;

      calculationService = new CalculationService(mockUtilityService, null);
      const res = await calculationService.calculateLoanSolver(
        {
          opportunityId: 'opportunityId',
          quoteFinanceProduct: {
            financeProduct: {
              productAttribute: {
                interestRate: 5,
                loanAmount: 1200,
                loanStartDate: '02/01/2021',
                loanTerm: 10,
                reinvestment: [{ reinvestmentAmount: 100, reinvestmentMonth: 3 }],
              },
            },
          },
          quoteCostBuildup: { grossPrice: 101, storageQuoteDetails: [{ storageModelDataSnapshot: { sizekWh: 30 } }] },
          isSolar: true,
          isRetrofit: true,
          utilityProgram: {},
          systemProduction: {
            capacityKW: 10,
            productivity: 122,
          },
        } as any,
        19,
      );

      expect(res).toEqual(expect.any(Object));
    });
  });

  describe('getCurrentMonthPrincipleComponent function', () => {
    test('should prePaymentAmount greater than zero', async () => {});
    calculationService = new CalculationService(null, null);
    const res = calculationService.getCurrentMonthPrincipleComponent({
      monthlyPayment: 10,
      interestComponent: 2,
      unpaidInterest: 1000,
      prePaymentAmount: 100,
      unpaidInterestCumulative: 50,
    } as any);

    const res1 = calculationService.getCurrentMonthPrincipleComponent({
      monthlyPayment: 10,
      interestComponent: 2,
      unpaidInterest: 1000,
      prePaymentAmount: 0,
      unpaidInterestCumulative: 50,
    } as any);

    expect(res).toEqual(expect.any(Number));
    expect(res1).toEqual(expect.any(Number));
  });
});
