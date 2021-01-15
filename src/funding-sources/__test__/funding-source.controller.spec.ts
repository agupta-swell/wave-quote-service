import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Pagination, ServiceResponse } from 'src/app/common';
import { FundingSourceController } from '../funding-source.controller';
import { FundingSourceModule } from '../funding-source.module';
import { FUNDING_SOURCE } from '../funding-source.schema';
import { FundingSourceService } from '../funding-source.service';

describe('Funding Source Controller', () => {
  let fundingSourceController: FundingSourceController;
  let fundingSourceService: FundingSourceService;

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
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FundingSourceModule],
    })
      .overrideProvider(getModelToken(FUNDING_SOURCE))
      .useValue(mockRepository)
      .compile();

    fundingSourceService = moduleRef.get<FundingSourceService>(FundingSourceService);
    fundingSourceController = moduleRef.get<FundingSourceController>(FundingSourceController);
  });

  test('should getQuotings work correctly', async () => {
    const res = await fundingSourceController.getQuotings({ limit: '10', skip: '0' });

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.data).toEqual(expect.arrayContaining([expect.any(Object)]));
  });
});
