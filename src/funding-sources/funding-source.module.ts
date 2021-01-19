import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FundingSourceController } from './funding-source.controller';
import { FundingSourceSchema, FUNDING_SOURCE } from './funding-source.schema';
import { FundingSourceService } from './funding-source.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: FUNDING_SOURCE,
        schema: FundingSourceSchema,
        collection: 'funding_sources',
      },
    ]),
  ],
  controllers: [FundingSourceController],
  providers: [FundingSourceService],
  exports: [FundingSourceService],
})
export class FundingSourceModule {}
