import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AwsModule } from 'src/shared/aws/aws.module';
import { JwtConfigService } from '../authentication/jwt-config.service';
import { SystemProductionController } from './system-production.controller';
import { SystemProductionSchema, SYSTEM_PRODUCTION } from './system-production.schema';
import { SystemProductionService } from './system-production.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: SYSTEM_PRODUCTION,
        schema: SystemProductionSchema,
        collection: 'v2_system_production',
      },
    ]),
    AwsModule,
  ],
  providers: [SystemProductionService],
  controllers: [SystemProductionController],
  exports: [SystemProductionService],
})
export class SystemProductionModule {}
