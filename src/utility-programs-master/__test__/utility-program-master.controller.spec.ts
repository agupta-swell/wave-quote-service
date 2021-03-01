import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Pagination, ServiceResponse } from 'src/app/common';
import { UtilityProgramMasterController } from '../utility-program-master.controller';
import { UtilityProgramMasterModule } from '../utility-program-master.module';
import { UTILITY_PROGRAM_MASTER } from '../utility-program-master.schema';
import { UtilityProgramMasterService } from '../utility-program-master.service';

describe('Utility Program Master Controller', () => {
  let utilityProgramMasterController: UtilityProgramMasterController;
  let utilityProgramMasterService: UtilityProgramMasterService;

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce([{ utility_program_name: 'utility_program_name', rebate_amount: 1000 }]),
    estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UtilityProgramMasterModule],
    })
      .overrideProvider(getModelToken(UTILITY_PROGRAM_MASTER))
      .useValue(mockRepository)
      .compile();

    utilityProgramMasterService = moduleRef.get<UtilityProgramMasterService>(UtilityProgramMasterService);
    utilityProgramMasterController = moduleRef.get<UtilityProgramMasterController>(UtilityProgramMasterController);
  });

  test('should getList work correctly', async () => {
    const res = await utilityProgramMasterController.getList();

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.data).toEqual(expect.arrayContaining([expect.any(Object)]));
  });

  test('should createDataFeed work correctly', async () => {
    function mockUtilityProgramMasterModel(dto: any) {
      this.data = dto;
      this.save = () => this.data;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [UtilityProgramMasterModule],
    })
      .overrideProvider(getModelToken(UTILITY_PROGRAM_MASTER))
      .useValue(mockUtilityProgramMasterModel)
      .compile();

    const res = await moduleRef.get(UtilityProgramMasterController).dataFeed();

    expect(res).toBe('OK');
  });
});
