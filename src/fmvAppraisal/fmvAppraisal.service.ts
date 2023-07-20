import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { FmvAppraisal, FMV_APPRAISAL } from './fmvAppraisal.schema';

@Injectable()
export class FmvAppraisalService {
  constructor(
    @InjectModel(FMV_APPRAISAL) private readonly fmvAppraisalModel: Model<FmvAppraisal>,
  ) { }

  async findFmvAppraisalById(fmvAppraisalId: string): Promise<LeanDocument<FmvAppraisal> | null> {
    const res = await this.fmvAppraisalModel.findById(fmvAppraisalId).lean();
    return res;
  }
}
