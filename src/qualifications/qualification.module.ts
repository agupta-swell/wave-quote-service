import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { PropertyModule } from 'src/property/property.module';
import { QualificationController } from './qualification.controller';
import { QualificationCreditSchema, QUALIFICATION_CREDIT } from './qualification.schema';
import { QualificationService } from './qualification.service';
import { FNI_COMMUNICATION, FNI_CommunicationSchema } from './schemas/fni-communication.schema';
import { SightenController } from './sighten.controller';
import { FniCallbackService } from './sub-services/fni-callback.service';
import { FniEngineService } from './sub-services/fni-engine.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: QUALIFICATION_CREDIT, schema: QualificationCreditSchema, collection: 'v2_qualification_credits' },
      {
        name: FNI_COMMUNICATION,
        schema: FNI_CommunicationSchema,
        collection: 'v2_fni_communications',
      },
    ]),
    PropertyModule,
  ],
  controllers: [QualificationController, SightenController],
  providers: [QualificationService, FniEngineService, FniCallbackService],
  exports: [QualificationService],
})
export class QualificationModule {}
