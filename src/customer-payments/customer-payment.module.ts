import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CONTRACT, ContractSchema } from 'src/contracts/contract.schema';
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
      {
        name: CONTRACT,
        schema: ContractSchema,
        collection: 'v2_contracts',
      },
    ]),
  ],
  providers: [CustomerPaymentService],
  exports: [CustomerPaymentService],
})
export class CustomerPaymentModule {}
