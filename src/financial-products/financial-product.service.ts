import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { FINANCIAL_PRODUCT, FinancialProduct } from './financial-product.schema';
import { FinancialProductDto } from './res/financial-product.dto';

@Injectable()
export class FinancialProductsService {
  constructor(@InjectModel(FINANCIAL_PRODUCT) private financialProduct: Model<FinancialProduct>) {}

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<FinancialProductDto>>> {
    const [financialProducts, total] = await Promise.all([
      this.financialProduct.find().limit(limit).skip(skip).lean(),
      this.financialProduct.countDocuments().lean(),
    ]);

    return OperationResult.ok(
      new Pagination({
        data: financialProducts.map(financialProduct => new FinancialProductDto(financialProduct)),
        total,
      }),
    );
  }

  async getDetailByFinancialProductId(id: string): Promise<LeanDocument<FinancialProduct> | null> {
    const detail = await this.financialProduct.findOne({ _id: { $eq: Types.ObjectId(id) } }).lean();
    return detail;
  }
}
