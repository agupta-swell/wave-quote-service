import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FmvAppraisalSchema, FMV_APPRAISAL } from "./fmvAppraisal.schema";
import { FmvAppraisalService } from './fmvAppraisal.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: FMV_APPRAISAL,
        schema: FmvAppraisalSchema,
        collection: 'fmvAppraisal',
      },
    ]),
  ],
  providers: [
    FmvAppraisalService,
  ],
  exports: [
    FmvAppraisalService,
  ],
})
export class FmvAppraisalModule {};
