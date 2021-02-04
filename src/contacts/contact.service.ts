import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { Contact, CONTACT } from './contact.schema';
import { UpdateGeoLocation } from './req/update-leo-location.req';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(CONTACT) private readonly contactModel: Model<Contact>,
    private readonly opportunityService: OpportunityService,
  ) {}

  async saveGeolocation(req: UpdateGeoLocation): Promise<OperationResult<string>> {
    const { opportunityId, lat, lng } = req;
    const foundOpportunity = await this.opportunityService.getDetailById(opportunityId);
    if (!foundOpportunity) {
      throw ApplicationException.EnitityNotFound(opportunityId);
    }

    const foundContact = await this.contactModel.findById(foundOpportunity.contactId);
    if (!foundContact) {
      throw ApplicationException.EnitityNotFound(opportunityId);
    }

    foundContact.lat = lat;
    foundContact.lng = lng;

    await foundContact.save();

    return OperationResult.ok('Updated Successfully');
  }

  // =====================> INTERNAL <=====================

  async getEmailById(contactId: string): Promise<string | undefined> {
    const res = await this.contactModel.findById(contactId);
    return res?.toObject()?.email;
  }

  async getContactById(contactId: string): Promise<Contact | undefined> {
    const res = await this.contactModel.findById(contactId);
    return res?.toObject();
  }
}
