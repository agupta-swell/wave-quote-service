import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { QuotePartnerConfigController } from './quote-partner-config.controller';
import { QuotePartnerConfigSchema, QUOTE_PARTNER_CONFIG } from './quote-partner-config.schema';
import { QuotePartnerConfigService } from './quote-partner-config.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: QUOTE_PARTNER_CONFIG, schema: QuotePartnerConfigSchema, collection: 'v2_quotePartnerConfig' },
    ]),
  ],
  controllers: [QuotePartnerConfigController],
  providers: [QuotePartnerConfigService],
  exports: [QuotePartnerConfigService],
})
export class QuotePartnerConfigModule {}
