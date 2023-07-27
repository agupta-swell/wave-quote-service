import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';

import { DevFee } from './dev-fee.schema';
import { DEV_FEE } from './constant';

@Injectable()
export class DevFeeService {
  // @ts-ignore
  constructor(@InjectModel(DEV_FEE) private devFeeModel: Model<DevFee>) {}

  async getDevFeeByCondition(condition): Promise<LeanDocument<DevFee>> {
    const res = await this.devFeeModel.findOne(condition).lean();
    if (!res) throw Error('Unable to find dev fee');
    return res;
  }
}
