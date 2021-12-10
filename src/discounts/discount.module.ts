import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { DISCOUNT_COLLECTION } from './discount.constant';
import { DiscountSchema } from './discount.schema';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: DISCOUNT_COLLECTION,
        collection: DISCOUNT_COLLECTION,
        schema: DiscountSchema,
      },
    ]),
  ],
  providers: [DiscountService],
  controllers: [DiscountController],
  exports: [DiscountService],
})
export class DiscountModule {}
