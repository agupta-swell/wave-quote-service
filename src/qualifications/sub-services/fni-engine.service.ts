import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST_CATEGORY, REQUEST_TYPE } from '../constants';
import { FNI_Communication, FNI_COMMUNICATION } from '../schemas/fni-communication.schema';
import { IFniApplyReq } from '../typing.d';

@Injectable()
export class FniEngineService {
  constructor(@InjectModel(FNI_COMMUNICATION) private readonly fniCommunicationModel: Model<FNI_Communication>) {}
  //NOTE: NEVER NEVER NEVER NEVER store the fniApplyRequestParam or applyRequestInst in the database
  //NOTE: NEVER NEVER NEVER NEVER log the fniApplyRequestParam or applyRequestInst
  //NOTE: Copy this warning and paste it in the code at the top and bottom of this method

  async apply(req: IFniApplyReq): Promise<string> {
    const fniModel = new this.fniCommunicationModel({
      qualification_credit_id: req.qualificationCreditId,
      sent_on: new Date(),
      request_category: REQUEST_CATEGORY.CREDIT,
      request_type: REQUEST_TYPE.OUTBOUND,
    });

    await fniModel.save();

    const fniCommunicationId = fniModel._id;

    return;
  }
}
