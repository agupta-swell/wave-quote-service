import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { SystemProductionModule } from 'src/system-productions/system-production.module';
import { FinancialProductsController } from './financial-product.controller';
import { FinancialProductSchema, FINANCIAL_PRODUCT } from './financial-product.schema';
import { FinancialProductsService } from './financial-product.service';

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
    SystemProductionModule,
  ],
  providers: [FinancialProductsService],
  controllers: [FinancialProductsController],
  exports: [FinancialProductsService],
})
export class FinancialProductsModule {}
