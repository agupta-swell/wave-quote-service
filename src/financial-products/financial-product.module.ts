import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FINANCIAL_PRODUCT, FinancialProductSchema } from './financial-product.schema';
import { FinancialProductsService } from './financial-product.service';
import { FinancialProductsController } from './financial-product.controller';

// @Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
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
  exports: [FinancialProductsService],
})
export class FinancialProductsModule {}
