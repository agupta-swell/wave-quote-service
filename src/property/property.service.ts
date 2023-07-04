import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { PROPERTY_COLLECTION_NAME } from './constants';
import { PropertyDocument } from './property.schema';
import { AddNewHomeownerReqDto } from './req/add-new-homeowner';
import { GetHomeownersByIdResultResDto } from './res/get-homeowners-by-id';

@Injectable()
export class PropertyService {
  constructor(@InjectModel(PROPERTY_COLLECTION_NAME) private propertyModel: Model<PropertyDocument>) {}

  async addNewHomeowner(data: AddNewHomeownerReqDto, isPrimary = false) {
    const { propertyId, newContactId } = data;

    await this.propertyModel.findOneAndUpdate(
      { _id: propertyId },
      { $push: { homeowners: { contactId: newContactId, isPrimary } } },
    );
  }

  async getHomeownersById(propertyId: string): Promise<OperationResult<GetHomeownersByIdResultResDto[]>> {
    const homeowners = await this.findHomeownersById(propertyId);

    return OperationResult.ok(strictPlainToClass(GetHomeownersByIdResultResDto, homeowners));
  }

  // =====================> INTERNAL <=====================

  async findHomeownersById(propertyId: string): Promise<GetHomeownersByIdResultResDto[]> {
    const property = await this.propertyModel.findById(propertyId).lean();

    return property?.homeowners || [];
  }

  async findPropertyById(propertyId: string): Promise<LeanDocument<PropertyDocument> | null> {
    const result = await this.propertyModel.findById(propertyId).lean();

    return result;
  }
}
