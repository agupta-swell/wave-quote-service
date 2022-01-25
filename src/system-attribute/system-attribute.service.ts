import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model, UpdateQuery } from 'mongoose';
import { SystemAttribute, SYSTEM_ATTRIBUTE_MODEL } from './system-attribute.schema';

@Injectable()
export class SystemAttributeService {
  constructor(@InjectModel(SYSTEM_ATTRIBUTE_MODEL) private systemAttributeModel: Model<SystemAttribute>) {}

  async updateSystemAttributeByQuery(
    query: FilterQuery<SystemAttribute>,
    updatePayload: UpdateQuery<SystemAttribute>,
  ): Promise<LeanDocument<SystemAttribute> | null> {
    const updatedSystemAttribute = await this.systemAttributeModel
      .findOneAndUpdate(query, updatePayload, { new: true, upsert: true })
      .lean();

    return updatedSystemAttribute;
  }
}
