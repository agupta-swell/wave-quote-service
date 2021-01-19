import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { LeaseSolverConfigController } from './lease-solver-config.controller';
import { LeaseSolverConfigSchema, LEASE_SOLVER_CONFIG } from './lease-solver-config.schema';
import { LeaseSolverConfigService } from './lease-solver-config.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: LEASE_SOLVER_CONFIG,
        schema: LeaseSolverConfigSchema,
        collection: 'v2_lease_solver_configs',
      },
    ]),
  ],
  controllers: [LeaseSolverConfigController],
  providers: [LeaseSolverConfigService],
  exports: [LeaseSolverConfigService],
})
export class LeaseSolverConfigModule {}
