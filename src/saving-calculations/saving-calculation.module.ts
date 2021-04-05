import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { SavingCalculationController } from './saving-calculation.controller';
import { SavingCalculationService } from './saving-calculation.service';
import {
  SavingEngineBillSchema,
  SavingEngineScenarioSchema,
  SAVING_ENGINE_BILL,
  SAVING_ENGINE_SCENARIO,
} from './schemas';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: SAVING_ENGINE_BILL,
        schema: SavingEngineBillSchema,
        collection: 'v2_savings_engine_bills',
      },
      {
        name: SAVING_ENGINE_SCENARIO,
        schema: SavingEngineScenarioSchema,
        collection: 'v2_savings_engine_scenarios',
      },
    ]),
  ],
  controllers: [SavingCalculationController],
  providers: [SavingCalculationService],
  exports: [SavingCalculationService],
})
export class SavingCalculationModule {}
