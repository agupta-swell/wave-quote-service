import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProductController } from '../product.controller';
import { ProductModule } from '../product.module';
import { PRODUCT } from '../product.schema';

describe('Product Controller', () => {
  let productController: ProductController;

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            manufacturer: 'manufacturer',
            name: 'name',
            type: 'type',
            price: 'price',
            sizeW: 'sizeW',
            sizekWh: 'sizekWh',
            partNumber: ['partNumber'],
            dimension: {
              length: 10,
              width: 10,
            },
          },
        ]),
      }),
    }),
    countDocuments: jest.fn().mockReturnValueOnce(1),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductModule],
    })
      .overrideProvider(getModelToken(PRODUCT))
      .useValue(mockRepository)
      .compile();

    productController = moduleRef.get<ProductController>(ProductController);
  });

  test('should getAllProductsByType work correctly', async () => {
    const res = await productController.getAllProductsByType({ limit: '10', skip: '0', types: 'battery,storage' });

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.total).toBe(1);
  });
});
