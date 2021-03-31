import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FINANCIAL_PRODUCT, FinancialProductSchema } from './financial-product.schema';
import { FinancialProductsService } from './financial-product.service';
import { FinancialProductsController } from './financial-product.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FINANCIAL_PRODUCT,
        schema: FinancialProductSchema,
        collection: 'v2_financial_products',
      },
    ]),
  ],
  providers: [FinancialProductsService],
  controllers: [FinancialProductsController],
})
export class FinancialProductsModule {}
