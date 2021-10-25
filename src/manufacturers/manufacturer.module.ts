import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ManufacturerController } from './manufacturer.controller';
import { ManufacturerSchema, V2_MANUFACTURERS_COLL } from './manufacturer.schema';
import { ManufacturerService } from './manufacturer.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: V2_MANUFACTURERS_COLL,
        schema: ManufacturerSchema,
        collection: V2_MANUFACTURERS_COLL,
      },
    ]),
  ],
  controllers: [ManufacturerController],
  providers: [ManufacturerService],
  exports: [ManufacturerService],
})
export class ManufacturerModule {}
