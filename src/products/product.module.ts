import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { PRODUCT, ProductSchema } from './product.schema';
import { ProductService } from './product.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: PRODUCT, schema: ProductSchema, collection: 'products' }])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
