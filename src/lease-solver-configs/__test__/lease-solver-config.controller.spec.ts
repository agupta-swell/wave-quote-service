import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ServiceResponse } from 'src/app/common';
import { LeaseSolverConfigController } from '../lease-solver-config.controller';
import { LeaseSolverConfigModule } from '../lease-solver-config.module';
import { LEASE_SOLVER_CONFIG } from '../lease-solver-config.schema';

describe('Funding Source Controller', () => {
  let leaseSolverConfigController: LeaseSolverConfigController;

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            _id: 'string',
            name: 'string',
            isTrancheApplicable: 'string',
            type: 'string',
          },
        ]),
      }),
    }),
    countDocuments: jest.fn().mockReturnValueOnce(1),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LeaseSolverConfigModule],
    })
      .overrideProvider(getModelToken(LEASE_SOLVER_CONFIG))
      .useValue(mockRepository)
      .compile();

    leaseSolverConfigController = moduleRef.get<LeaseSolverConfigController>(LeaseSolverConfigController);
  });

  test('should createDataFromCSV work correctly', async () => {
    const mockReq = {
      file: jest
        .fn()
        .mockResolvedValue(['1', '2'])
        .mockResolvedValue({
          toBuffer: jest.fn().mockResolvedValue({
            toString: jest.fn().mockReturnValue(
              `test string 
               test new line
              `,
            ),
          }),
        }),
    };

    function mockLeaseSolverConfigModel(dto: any) {
      this.data = dto;
      this.save = () => this.data;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [LeaseSolverConfigModule],
    })
      .overrideProvider(getModelToken(LEASE_SOLVER_CONFIG))
      .useValue(mockLeaseSolverConfigModel)
      .compile();
    const res = await moduleRef.get(LeaseSolverConfigController).createDataFromCSV(mockReq);

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBe('okeeeeeee');
  });

  test('should createDataFromCSV work correctly without data', async () => {
    const mockReq = {
      file: jest
        .fn()
        .mockResolvedValue(['1', '2'])
        .mockResolvedValue({
          toBuffer: jest.fn().mockResolvedValue({ toString: jest.fn().mockReturnValue('') }),
        }),
    };
    const res = await leaseSolverConfigController.createDataFromCSV(mockReq);

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBe('okeeeeeee');
  });
});
