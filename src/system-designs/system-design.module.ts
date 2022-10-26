import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { ProductModuleV2 } from 'src/products-v2/product.module';
import { AwsModule } from 'src/shared/aws/aws.module';
import { GoogleSunroofModule } from 'src/shared/google-sunroof/google-sunroof.module';
import { SystemProductionModule } from 'src/system-production/system-production.module';
import { ExistingSystemModule } from 'src/existing-systems/existing-system.module';
import { ProductionDeratesModule } from 'src/production-derates-v2/production-derates-v2.module';
import { PvWattSystemProductionSchema, PV_WATT_SYSTEM_PRODUCTION } from './schemas';
import { SunroofHourlyProductionCalculation, SystemProductService } from './sub-services';
import { SystemDesignController } from './system-design.controller';
import { PURE_SYSTEM_DESIGN, SystemDesignSchema, SYSTEM_DESIGN } from './system-design.schema';
import { SystemDesignService } from './system-design.service';
import { createSystemDesignProvider } from './providers/system-design-model.provider';
import { SystemDesignHook } from './providers/system-design.hook';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: PV_WATT_SYSTEM_PRODUCTION,
        schema: PvWattSystemProductionSchema,
        collection: 'v2_pv_watt_system_productions',
      },
      { name: PURE_SYSTEM_DESIGN, schema: SystemDesignSchema, collection: 'v2_system_designs' },
    ]),
    AwsModule,
    GoogleSunroofModule,
    ProductModuleV2,
    ManufacturerModule,
    SystemProductionModule,
    ExistingSystemModule,
    ProductionDeratesModule,
  ],
  controllers: [SystemDesignController],
  providers: [
    SystemDesignService,
    SystemProductService,
    SystemDesignHook,
    {
      provide: 'systemDesignHook',
      useExisting: SystemDesignHook,
    },
    createSystemDesignProvider(SYSTEM_DESIGN, 'v2_system_designs', 'systemDesignHook'),
    SunroofHourlyProductionCalculation,
  ],
  exports: [SystemDesignService, SystemProductService, SunroofHourlyProductionCalculation],
})
export class SystemDesignModule {}
