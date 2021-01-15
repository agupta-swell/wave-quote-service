import { UtilityProgramMasterService } from '../utility-program-master.service';

describe('Utility Program Master Service', () => {
  let utilityProgramMasterService: UtilityProgramMasterService;

  describe('getDetailById function', () => {
    test(`should return undefined value`, async () => {
      const mockUtilityProgramMaster = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      utilityProgramMasterService = new UtilityProgramMasterService(mockUtilityProgramMaster);

      const res = await utilityProgramMasterService.getDetailById('id');

      expect(res).toMatchSnapshot();
      expect(res).toBeNull();
      expect(mockUtilityProgramMaster.findById).toHaveBeenCalledTimes(1);
    });

    test('should return utility program name model', async () => {
      const mockModel = { utility_program_name: 'string', rebate_amount: 1000 };
      const mockUtilityProgramMaster = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      utilityProgramMasterService = new UtilityProgramMasterService(mockUtilityProgramMaster);

      const res = await utilityProgramMasterService.getDetailById('id');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toMatchObject(mockModel);
      expect(mockUtilityProgramMaster.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDetailByName function', () => {
    test(`should return undefined value`, async () => {
      const mockUtilityProgramMaster = {
        findOne: jest.fn().mockResolvedValue(null),
      } as any;

      utilityProgramMasterService = new UtilityProgramMasterService(mockUtilityProgramMaster);

      const res = await utilityProgramMasterService.getDetailByName('utility_program_name');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockUtilityProgramMaster.findOne).toHaveBeenCalledTimes(1);
    });

    test('should return utility program name model', async () => {
      const mockModel = {
        utility_program_name: 'string',
        rebate_amount: 1000,
        toObject: jest.fn().mockReturnValueOnce({ utility_program_name: 'string', rebate_amount: 1000 }),
      };
      const mockUtilityProgramMaster = {
        findOne: jest.fn().mockResolvedValue(mockModel),
      } as any;

      utilityProgramMasterService = new UtilityProgramMasterService(mockUtilityProgramMaster);

      const res = await utilityProgramMasterService.getDetailByName('utility_program_name');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject({ utility_program_name: 'string', rebate_amount: 1000 });
      expect(mockUtilityProgramMaster.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAll function', () => {
    test(`should return empty array`, async () => {
      const mockUtilityProgramMaster = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      utilityProgramMasterService = new UtilityProgramMasterService(mockUtilityProgramMaster);

      const res = await utilityProgramMasterService.getAll();

      expect(res).toMatchSnapshot();
      expect(res).toHaveLength(0);
      expect(mockUtilityProgramMaster.find).toHaveBeenCalledTimes(1);
    });

    test('should return utility program name model array', async () => {
      const mockModel = {
        utility_program_name: 'string',
        rebate_amount: 1000,
        toObject: jest.fn().mockReturnValueOnce({ utility_program_name: 'string', rebate_amount: 1000 }),
      };
      const mockUtilityProgramMaster = {
        find: jest.fn().mockResolvedValue([mockModel]),
      } as any;

      utilityProgramMasterService = new UtilityProgramMasterService(mockUtilityProgramMaster);

      const res = await utilityProgramMasterService.getAll();

      expect(res).toMatchSnapshot();
      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({ utility_program_name: 'string', rebate_amount: 1000 });
      expect(mockUtilityProgramMaster.find).toHaveBeenCalledTimes(1);
    });
  });
});
