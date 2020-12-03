import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { QualificationController } from './qualification.controller';
import { QualificationCreditSchema, QUALIFICATION_CREDIT } from './qualification.schema';
import { QualificationService } from './qualification.service';
import { FNI_COMMUNICATION, FNI_CommunicationSchema } from './schemas/fni-communication.schema';
import { FniEngineService } from './sub-services/fni-engine.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.QUALIFICATION_JWT_SECRET,
    }),
    MongooseModule.forFeature([
      { name: QUALIFICATION_CREDIT, schema: QualificationCreditSchema, collection: 'v2_qualification_credits' },
      {
        name: FNI_COMMUNICATION,
        schema: FNI_CommunicationSchema,
        collection: 'v2_fni_communications',
      },
    ]),
  ],
  controllers: [QualificationController],
  providers: [QualificationService, FniEngineService],
  exports: [QualificationService],
})
export class QualificationModule {}
