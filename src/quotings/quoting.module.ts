import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotingController } from './quoting.controller';
import { QUOTING, QuotingSchema } from './quoting.schema';
import { QuotingService } from './quoting.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: QUOTING, schema: QuotingSchema, collection: 'quotings' }])],
  controllers: [QuotingController],
  providers: [QuotingService],
  exports: [QuotingService],
})
export class QuotingModule {}
