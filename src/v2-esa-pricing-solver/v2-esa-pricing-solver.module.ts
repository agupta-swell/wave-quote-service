import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { UtilityMasterSchema, UTILITY_MASTER } from 'src/docusign-templates-master/schemas/utility-master.schema';
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
        name: UTILITY_MASTER,
        collection: 'v2_utilities_master',
        schema: UtilityMasterSchema,
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
