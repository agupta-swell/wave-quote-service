import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaseSolverConfigController } from './lease-solver-config.controller';
import { LeaseSolverConfigSchema, LEASE_SOLVER_CONFIG } from './lease-solver-config.schema';
import { LeaseSolverConfigService } from './lease-solver-config.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: LEASE_SOLVER_CONFIG,
        schema: LeaseSolverConfigSchema,
        collection: 'lease_solver_config',
      },
    ]),
  ],
  controllers: [LeaseSolverConfigController],
  providers: [LeaseSolverConfigService],
  exports: [LeaseSolverConfigService],
})
export class LeaseSolverConfigModule {}
