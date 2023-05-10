import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EsaPaymentConfigSchema, ESA_PAYMENT_CONFIG } from './esa-payment-config.schema';
import { EsaPaymentConfigService } from './esa-payment-config.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ESA_PAYMENT_CONFIG,
        schema: EsaPaymentConfigSchema,
        collection: 'v2_esa_payment_config',
      },
    ]),
  ],
  providers: [EsaPaymentConfigService],
  exports: [EsaPaymentConfigService],
})
export class EsaPaymentConfigModule {}
