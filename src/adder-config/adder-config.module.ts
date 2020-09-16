import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdderConfigController } from './adder-config.controller';
import { ADDER_CONFIG, AdderConfigSchema } from './adder-config.schema';
import { AdderConfigService } from './adder-config.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: ADDER_CONFIG, schema: AdderConfigSchema, collection: 'adderconfig' }])],
  controllers: [AdderConfigController],
  providers: [AdderConfigService],
  exports: [AdderConfigService],
})
export class AdderConfigModule {}
