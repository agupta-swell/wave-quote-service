import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { USAGE_PROFILE_COLL } from './constants';
import { UsageProfileSchema } from './schema';
import { UsageProfileController } from './usage-profile.controller';
import { UsageProfileService } from './usage-profile.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: USAGE_PROFILE_COLL, schema: UsageProfileSchema, collection: USAGE_PROFILE_COLL },
    ]),
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
  ],
  providers: [UsageProfileService],
  controllers: [UsageProfileController],
  exports: [UsageProfileService],
})
export class UsageProfileModule {}
