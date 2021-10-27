import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { V2_INSTALLED_PRODUCT_COLL } from './constants';
import { InstalledProductService } from './installed-product.service';
import { InstalledProductSchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: V2_INSTALLED_PRODUCT_COLL, schema: InstalledProductSchema, collection: V2_INSTALLED_PRODUCT_COLL },
    ]),
  ],
  providers: [InstalledProductService],
  exports: [InstalledProductService],
})
export class InstalledProductModule {}
