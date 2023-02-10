import { CacheModule, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ECommerceController } from './e-commerce.controller';
import { ECommerceService } from './e-commerce.service';
import {
  ECommerceConfigSchema,
  ECommerceProductSchema,
  ECommerceSystemDesignSchema,
  E_COMMERCE_CONFIG,
  E_COMMERCE_PRODUCT,
  E_COMMERCE_SYSTEM_DESIGN,
  REGION,
  RegionSchema,
  SnowDerateSchema,
  SNOW_DERATE,
  SoilingDerateSchema,
  SOILING_DERATE,
  ZipCodeRegionMapSchema,
  ZIP_CODE_REGION_MAP,
} from './schemas';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: E_COMMERCE_SYSTEM_DESIGN, schema: ECommerceSystemDesignSchema, collection: 'v2_ecom_system_designs' },
      { name: E_COMMERCE_CONFIG, schema: ECommerceConfigSchema, collection: 'v2_ecom_configs' },
      { name: REGION, schema: RegionSchema, collection: 'v2_regions' },
      { name: SOILING_DERATE, schema: SoilingDerateSchema, collection: 'v2_soiling_derates' },
      { name: SNOW_DERATE, schema: SnowDerateSchema, collection: 'v2_snow_derates' },
      { name: ZIP_CODE_REGION_MAP, schema: ZipCodeRegionMapSchema, collection: 'v2_zipcode_region_maps' },
      { name: E_COMMERCE_PRODUCT, schema: ECommerceProductSchema, collection: 'v2_ecom_products' },
    ]),
    CacheModule.register(),
  ],
  controllers: [ECommerceController],
  providers: [ECommerceService],
  exports: [ECommerceService],
})
export class ECommerceModule {}
