import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema, PRODUCT } from './product.schema';
import { ProductService } from './product.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: PRODUCT, schema: ProductSchema, collection: 'products' }])],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
