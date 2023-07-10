import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { UtilitiesSchema, UTILITIES } from 'src/utilities/schemas/utilities.schema';
import { V2_MANUFACTURERS_COLL, ManufacturerSchema } from 'src/manufacturers/manufacturer.schema';
import { EsaPricingSolverController } from './v2-esa-pricing-solver.controller';
import { V2EsaPricingSolverSchema } from './v2-esa-pricing-solver.schema';
import { EsaPricingSolverService } from './v2-esa-pricing-solver.service';
import { V2_ESA_PRICING_SOLVER_COLLECTION } from './constants';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: V2_ESA_PRICING_SOLVER_COLLECTION,
        collection: V2_ESA_PRICING_SOLVER_COLLECTION,
        schema: V2EsaPricingSolverSchema,
      },
      {
        name: UTILITIES,
        collection: 'utilities',
        schema: UtilitiesSchema,
      },
      {
        name: V2_MANUFACTURERS_COLL,
        collection: V2_MANUFACTURERS_COLL,
        schema: ManufacturerSchema,
      },
    ]),
  ],
  controllers: [EsaPricingSolverController],
  providers: [EsaPricingSolverService],
  exports: [EsaPricingSolverService],
})
export class EsaPricingSolverModule {}
