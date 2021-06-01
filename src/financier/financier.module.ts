import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FINANCIER_COLLECTION } from './financier.constant';
import { FinancierSchema } from './financier.schema';
import { FinancierService } from './financier.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FINANCIER_COLLECTION,
        schema: FinancierSchema,
        collection: FINANCIER_COLLECTION,
      },
    ]),
  ],
  providers: [FinancierService],
  exports: [FinancierService],
})
export class FinancierModule {}
