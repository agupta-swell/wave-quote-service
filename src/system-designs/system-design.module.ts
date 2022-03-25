import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { ProductModuleV2 } from 'src/products-v2/product.module';
import { AwsModule } from 'src/shared/aws/aws.module';
import { GoogleSunroofModule } from 'src/shared/google-sunroof/google-sunroof.module';
import { SystemProductionModule } from 'src/system-production/system-production.module';
import { PvWattSystemProductionSchema, PV_WATT_SYSTEM_PRODUCTION } from './schemas';
import { SystemProductService, UploadImageService } from './sub-services';
import { SystemDesignController } from './system-design.controller';
import { SystemDesignSchema, SYSTEM_DESIGN } from './system-design.schema';
import { SystemDesignService } from './system-design.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: SYSTEM_DESIGN, schema: SystemDesignSchema, collection: 'v2_system_designs' },
      {
        name: PV_WATT_SYSTEM_PRODUCTION,
        schema: PvWattSystemProductionSchema,
        collection: 'v2_pv_watt_system_productions',
      },
    ]),
    AwsModule,
    GoogleSunroofModule,
    ProductModuleV2,
    ManufacturerModule,
    SystemProductionModule,
  ],
  controllers: [SystemDesignController],
  providers: [SystemDesignService, SystemProductService, UploadImageService],
  exports: [SystemDesignService, SystemProductService],
})
export class SystemDesignModule {}
