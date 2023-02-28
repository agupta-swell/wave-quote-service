import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FEATURE_FLAG_COLLECTION } from './constants';
import { FeatureFlagController } from './feature-flag.controller';
import { FeatureFlagSchema, FEATURE_FLAG } from './feature-flag.schema';
import { FeatureFlagService } from './feature-flag.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: FEATURE_FLAG,
        schema: FeatureFlagSchema,
        collection: FEATURE_FLAG_COLLECTION,
      },
    ]),
  ],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService],
  exports: [FeatureFlagService],
})
export class FeatureFlagModule {}
