import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ELECTRIC_VEHICLE_COLL } from './constants';
import { ElectricVehicleSchema } from './schemas';
import { ElectricVehicleController } from './electric-vehicle.controller';
import { ElectricVehicleService } from './electric-vehicle.service';
import { ValidateAndSnapshotElectricVehiclesPipe } from './pipes';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { collection: ELECTRIC_VEHICLE_COLL, name: ELECTRIC_VEHICLE_COLL, schema: ElectricVehicleSchema },
    ]),
  ],
  controllers: [ElectricVehicleController],
  providers: [ElectricVehicleService, ValidateAndSnapshotElectricVehiclesPipe],
  exports: [ElectricVehicleService, ValidateAndSnapshotElectricVehiclesPipe],
})
export class ElectricVehicleModule {}
