import { Types } from 'mongoose';
import { ProductService } from '../product.service';

describe('Product Service', () => {
  let productService: ProductService;

  describe('getDetailById function', () => {
    test(`should return null `, async () => {
      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      productService = new ProductService(mockFundingSource);
      const res = await productService.getDetailById(new Types.ObjectId().toHexString());

      expect(res).toMatchSnapshot();
      expect(res).toBeNull();
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });

    test('should return product model', async () => {
      const mockModel = {
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
      };

      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      productService = new ProductService(mockFundingSource);
      const res = await productService.getDetailById('productId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toMatchObject(mockModel);
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });
  });
});
