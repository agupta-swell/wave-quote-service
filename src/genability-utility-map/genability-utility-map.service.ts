import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenabilityUtilityMap, GENABILITY_UTILITY_MAP_MODEL } from './genability-utility-map.schema';

@Injectable()
export class GenabilityUtilityMapService {
  constructor(@InjectModel(GENABILITY_UTILITY_MAP_MODEL) private genabilityUtilityMapModel: Model<GenabilityUtilityMap>) {}

  /**
   *
   * @param genabilityLseName
   *
   * @returns wave_utility_code
   *
   * E.g: SCE, SCG, PE&G,...
   *
   */
  async getWavUtilityCodeByGenabilityLseName(genabilityLseName: string): Promise<string> {
    const foundMapping = await this.genabilityUtilityMapModel.findOne({ genabilityLseName }).lean();
    return foundMapping?.waveUtilityCode || '';
  }
}
