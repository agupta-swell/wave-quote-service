import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { QuoteController } from './quote.controller';
import { QUOTE, QuoteSchema } from './quote.schema';
import { QuoteService } from './quote.service';
import { TaxCreditConfigSchema, TAX_CREDIT_CONFIG } from './schemas/tax-credit-config.schema';
import { CalculationService } from './sub-services';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: QUOTE, schema: QuoteSchema, collection: 'v2_quotes' },
      {
        name: TAX_CREDIT_CONFIG,
        schema: TaxCreditConfigSchema,
        collection: 'v2_tax_credit_configs',
      },
    ]),
  ],
  controllers: [QuoteController],
  providers: [QuoteService, CalculationService],
  exports: [QuoteService],
})
export class QuoteModule {}
