import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { PRODUCT_COLL, PRODUCT_MODEL_NAME } from './constants';
import { ProductControllerV2 } from './product.controller';
import { ProductSchema } from './product.schema';
import { ProductService } from './services';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([{ name: PRODUCT_MODEL_NAME, schema: ProductSchema, collection: PRODUCT_COLL }]),
  ],
  controllers: [ProductControllerV2],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModuleV2 {}
