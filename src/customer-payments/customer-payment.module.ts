import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerPaymentSchema, CUSTOMER_PAYMENT } from './customer-payment.schema';
import { CustomerPaymentService } from './customer-payment.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CUSTOMER_PAYMENT,
        schema: CustomerPaymentSchema,
        collection: 'customer_payments',
      },
    ]),
  ],
  providers: [CustomerPaymentService],
  exports: [CustomerPaymentService],
})
export class CustomerPaymentModule {}
