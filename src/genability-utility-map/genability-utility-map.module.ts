import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { GenabilityUtilityMapService } from './genability-utility-map.service';
import {
  GenabilityUtilityMapSchema,
  GENABILITY_UTILITY_MAP_COLL,
  GENABILITY_UTILITY_MAP_MODEL,
} from './genability-utility-map.schema';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: GENABILITY_UTILITY_MAP_MODEL,
        schema: GenabilityUtilityMapSchema,
        collection: GENABILITY_UTILITY_MAP_COLL,
      },
    ]),
  ],
  providers: [GenabilityUtilityMapService],
  exports: [GenabilityUtilityMapService],
})
export class GenabilityUtilityMapModule {}
