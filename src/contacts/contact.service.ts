import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, CONTACT } from './contact.schema';

@Injectable()
export class ContactService {
  constructor(@InjectModel(CONTACT) private contactModel: Model<Contact>) {}

  // =====================> INTERNAL <=====================

  async getEmailById(contactId: string): Promise<string> {
    const res = await this.contactModel.findById(contactId);
    return res?.toObject()?.email;
  }
}
