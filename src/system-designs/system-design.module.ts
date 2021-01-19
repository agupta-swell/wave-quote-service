import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { PvWattSystemProductionSchema, PV_WATT_SYSTEM_PRODUCTION } from './schemas/pv-watt-system-production.schema';
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
  ],
  controllers: [SystemDesignController],
  providers: [SystemDesignService, SystemProductService, UploadImageService],
  exports: [SystemDesignService],
})
export class SystemDesignModule {}
