import { LeaseSolverConfigService } from '../lease-solver-config.service';

describe('Lease Solver Config Service', () => {
  let leaseSolverConfigService: LeaseSolverConfigService;

  describe('getDetailByConditions function', () => {
    const conditions = {
      isSolar: true,
      isRetrofit: true,
      utilityProgramName: ' string',
      contractTerm: 0,
      storageSize: 0,
      rateEscalator: 0,
      capacityKW: 0,
      productivity: 0,
    };

    test(`should return null `, async () => {
      const mockFundingSource = {
        findOne: jest.fn().mockResolvedValue(null),
      } as any;

      leaseSolverConfigService = new LeaseSolverConfigService(mockFundingSource);
      const res = await leaseSolverConfigService.getDetailByConditions(conditions);

      expect(res).toMatchSnapshot();
      expect(res).toBeNull();
      expect(mockFundingSource.findOne).toHaveBeenCalledTimes(1);
    });

    test('should return Lease Solver Config model', async () => {
      const mockModel = {
        is_solar: true,
        is_retrofit: true,
        utility_program_name: 'utility_program_name',
        contract_term: 0,
        storage_size: 0,
        solar_size_minimum: 0,
        solar_size_maximum: 0,
        adjusted_install_cost: 0,
        rate_factor: 0,
        productivity_min: 0,
        productivity_max: 0,
        rate_escalator: 0,
        rate_per_kWh: 0,
        storage_payment: 0,
        grid_services_discount: 0,
      };

      const mockFundingSource = {
        findOne: jest.fn().mockResolvedValue(mockModel),
      } as any;

      leaseSolverConfigService = new LeaseSolverConfigService(mockFundingSource);
      const res = await leaseSolverConfigService.getDetailByConditions(conditions);

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toMatchObject(mockModel);
      expect(mockFundingSource.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getListSolverCofigsByConditions function', () => {
    test(`should return empty array`, async () => {
      const mockFundingSource = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      leaseSolverConfigService = new LeaseSolverConfigService(mockFundingSource);
      const res = await leaseSolverConfigService.getListSolverCofigsByConditions(true, true, 'utilityProgramName');

      expect(res).toMatchSnapshot();
      expect(res).toHaveLength(0);
      expect(mockFundingSource.find).toHaveBeenCalledTimes(1);
    });

    test('should return Lease Solver Config array', async () => {
      const mockResponse = {
        is_solar: true,
        is_retrofit: true,
        utility_program_name: 'utility_program_name',
        contract_term: 0,
        storage_size: 0,
        solar_size_minimum: 0,
        solar_size_maximum: 0,
        adjusted_install_cost: 0,
        rate_factor: 0,
        productivity_min: 0,
        productivity_max: 0,
        rate_escalator: 0,
        rate_per_kWh: 0,
        storage_payment: 0,
        grid_services_discount: 0,
      };

      const mockModel = {
        ...mockResponse,
        toObject: jest.fn().mockReturnValueOnce(mockResponse),
      };
      const mockFundingSource = {
        find: jest.fn().mockResolvedValue([mockModel]),
      } as any;

      leaseSolverConfigService = new LeaseSolverConfigService(mockFundingSource);
      const res = await leaseSolverConfigService.getListSolverCofigsByConditions(true, false, 'utilityProgramName');

      expect(res).toMatchSnapshot();
      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject(mockResponse);
      expect(mockFundingSource.find).toHaveBeenCalledTimes(1);
    });
  });
});
