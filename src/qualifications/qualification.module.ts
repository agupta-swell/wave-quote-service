import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { PropertyModule } from 'src/property/property.module';
import { TokenModule } from 'src/tokens/token.module';
import { ApiMetricsModule } from 'src/shared/api-metrics/api-metrics.module';
import { QualificationController } from './qualification.controller';
import { QualificationCreditSchema, QUALIFICATION_CREDIT } from './qualification.schema';
import { QualificationService } from './qualification.service';
import { FniEngineService } from './sub-services/fni-engine.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: QUALIFICATION_CREDIT, schema: QualificationCreditSchema, collection: 'v2_qualification_credits' },
    ]),
    PropertyModule,
    ApiMetricsModule,
    TokenModule,
  ],
  controllers: [QualificationController],
  providers: [QualificationService, FniEngineService],
  exports: [QualificationService],
})
export class QualificationModule {}
