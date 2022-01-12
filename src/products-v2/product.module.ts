import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { MongoBucketModule } from 'src/shared/mongo';
import { PRODUCT_COLL, PRODUCT_MODEL_NAME, PRODUCT_BUCKET } from './constants';
import { ValidateUploadBatteryAssetsInterceptor } from './interceptors';
import { ProductControllerV2 } from './product.controller';
import { ProductSchema } from './schemas';
import { ProductService } from './services';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([{ name: PRODUCT_MODEL_NAME, schema: ProductSchema, collection: PRODUCT_COLL }]),
    MongoBucketModule.forFeature(PRODUCT_BUCKET),
  ],
  controllers: [ProductControllerV2],
  providers: [ValidateUploadBatteryAssetsInterceptor, ProductService],
  exports: [ProductService],
})
export class ProductModuleV2 {}
