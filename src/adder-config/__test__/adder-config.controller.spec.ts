import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Pagination, ServiceResponse } from 'src/app/common';
import { AdderConfigController } from '../adder-config.controller';
import { AdderConfigModule } from '../adder-config.module';
import { ADDER_CONFIG } from '../adder-config.schema';

describe('Adder Config Controller', () => {
  let adderConfigController: AdderConfigController;

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            _id: '_id',
            adder: 'adder',
            price: 1000,
            increment: 'string',
            modifiedAt: Date,
          },
        ]),
      }),
    }),
    estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AdderConfigModule],
    })
      .overrideProvider(getModelToken(ADDER_CONFIG))
      .useValue(mockRepository)
      .compile();

    adderConfigController = moduleRef.get<AdderConfigController>(AdderConfigController);
  });

  test('should getAllAdderConfigs work correctly', async () => {
    const res = await adderConfigController.getAllAdderConfigs({ limit: '10', skip: '0' });

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.data).toEqual(expect.arrayContaining([expect.any(Object)]));
  });
});
