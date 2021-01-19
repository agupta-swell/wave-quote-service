import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { AdderConfigController } from './adder-config.controller';
import { AdderConfigSchema, ADDER_CONFIG } from './adder-config.schema';
import { AdderConfigService } from './adder-config.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([{ name: ADDER_CONFIG, schema: AdderConfigSchema, collection: 'adderconfig' }]),
  ],
  controllers: [AdderConfigController],
  providers: [AdderConfigService],
  exports: [AdderConfigService],
})
export class AdderConfigModule {}
