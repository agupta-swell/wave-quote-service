import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { PropertyService } from 'src/property/property.service';
import { CONTACT, Contact } from './contact.schema';
import { AddNewContactReqDto } from './req/add-new-contact.req';
import { UpdateGeoLocation } from './req/update-leo-location.req';
import { COUNTER, Counter } from './sub-schemas/counter.schema';
import { checkEmailsEqual } from 'src/utils/common';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(CONTACT) private readonly contactModel: Model<Contact>,
    @InjectModel(COUNTER) private readonly countersModel: Model<Counter>,
    private readonly opportunityService: OpportunityService,
    private readonly propertyService: PropertyService,
  ) {}

  async saveGeolocation(req: UpdateGeoLocation): Promise<OperationResult<string>> {
    const { opportunityId, lat, lng } = req;
    const foundOpportunity = await this.opportunityService.getDetailById(opportunityId);
    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    const foundContact = await this.contactModel.findById(foundOpportunity.contactId);
    if (!foundContact) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    foundContact.lat = lat;
    foundContact.lng = lng;

    await foundContact.save();

    return OperationResult.ok('Updated Successfully');
  }

  async addNewContact(addNewContactData: AddNewContactReqDto) {
    const { data, propertyId, opportunityId } = addNewContactData;

    const foundOpportunity = (await this.opportunityService.getRelatedInformation(opportunityId)).data;

    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    const { email: primaryEmail } = foundOpportunity;

    const { areEmailsEqual, message } = checkEmailsEqual(primaryEmail, data.email);

    if (areEmailsEqual) {
      throw ApplicationException.ValidationFailed(message);
    }

    const contactCounter = await this.countersModel.findOneAndUpdate(
      { _id: 'contactCounter' },
      { $inc: { nextVal: 1 } },
      { returnDocument: 'after', upsert: true },
    );

    const newContactModel = new this.contactModel({ ...data, contactId: contactCounter?.nextVal || 1 });
    const newContact = await newContactModel.save();

    await this.propertyService.addNewHomeowner({
      propertyId,
      newContactId: newContact.id,
    });
  }

  // =====================> INTERNAL <=====================

  async getEmailById(contactId: string): Promise<string | undefined> {
    const res = await this.contactModel.findById(contactId).lean();
    return res?.email;
  }

  async getContactById(contactId: string): Promise<LeanDocument<Contact> | null> {
    const res = await this.contactModel.findById(contactId).lean();
    return res;
  }
}
