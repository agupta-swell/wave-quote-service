import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevFeeSchema } from './dev-fee.schema';
import { DEV_FEE } from './constant';
import { DevFeeService } from './dev-fee.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DEV_FEE,
        schema: DevFeeSchema,
        collection: 'dev_fee',
      },
    ]),
  ],
  providers: [DevFeeService],
  exports: [DevFeeService],
})
export class DevFeeModule {}
