import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CashPaymentConfigSchema, CASH_PAYMENT_CONFIG } from './cash-payment-config.schema';
import { CashPaymentConfigService } from './cash-payment-config.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CASH_PAYMENT_CONFIG,
        schema: CashPaymentConfigSchema,
        collection: 'v2_cash_payment_config',
      },
    ]),
  ],
  providers: [CashPaymentConfigService],
  exports: [CashPaymentConfigService],
})
export class CashPaymentConfigModule {}
