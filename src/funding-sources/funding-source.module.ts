import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FundingSourceSchema, FUNDING_SOURCE } from './funding-source.schema';
import { FundingSourceService } from './funding-source.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FUNDING_SOURCE,
        schema: FundingSourceSchema,
        collection: 'funding_sources',
      },
    ]),
  ],
  controllers: [],
  providers: [FundingSourceService],
  exports: [FundingSourceService],
})
export class FundingSourceModule {}
