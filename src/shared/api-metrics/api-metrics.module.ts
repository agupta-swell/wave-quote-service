import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { V2APIMetricsSchema, V2_API_METRICS } from './api-metrics.schema';
import { ApiMetricsService } from './api-metrics.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: V2_API_METRICS,
        schema: V2APIMetricsSchema,
        collection: 'v2_api_metrics',
      },
    ]),
  ],
  providers: [ApiMetricsService],
  exports: [ApiMetricsService],
})
export class ApiMetricsModule {}
