import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { TAX_CREDIT_CONFIG_COLLECTION } from './tax-credit-config.constant';
import { TaxCreditConfigSchema } from './tax-credit-config.schema';
import { TaxCreditConfigService } from './tax-credit-config.service';
import { TaxCreditConfigController } from './tax-credit-config.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: TAX_CREDIT_CONFIG_COLLECTION,
        collection: TAX_CREDIT_CONFIG_COLLECTION,
        schema: TaxCreditConfigSchema,
      },
    ]),
  ],
  providers: [TaxCreditConfigService],
  controllers: [TaxCreditConfigController],
  exports: [TaxCreditConfigService],
})
export class TaxCreditConfigModule {}
