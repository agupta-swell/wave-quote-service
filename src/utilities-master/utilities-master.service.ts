import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { UtilitiesMaster, UTILITIES_MASTER } from './utilities-master.schema';

@Injectable()
export class UtilitiesMasterService {
  constructor(
    @InjectModel(UTILITIES_MASTER) private utilitiesMaster: Model<UtilitiesMaster>
  ) {}

  async getUtilitiesMasterDetailByName(name: string): Promise<LeanDocument<UtilitiesMaster> | null> {
    const detail = await this.utilitiesMaster.findOne({ utilityName: name }).lean();
    return detail;
  }
}
