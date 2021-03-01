import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { Opportunity, OPPORTUNITY } from './opportunity.schema';
import { GetRelatedInformationDto } from './res/get-related-information.dto';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectModel(OPPORTUNITY) private readonly opportunityModel: Model<Opportunity>,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
  ) {}

  async getRelatedInformation(opportunityId: string): Promise<OperationResult<GetRelatedInformationDto>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId);
    if (!foundOpportunity) {
      throw ApplicationException.EnitityNotFound(opportunityId);
    }

    const contact = await this.contactService.getContactById(foundOpportunity.contactId);

    const data = {
      address: contact.address1,
      city: contact.city,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      opportunityId,
      state: contact.state,
      utilityProgramId: foundOpportunity.utilityProgramId ?? '',
      zipCode: contact.zip,
      partnerId: foundOpportunity.accountId,
    };
    return OperationResult.ok(new GetRelatedInformationDto(data));
  }

  // =====================> INTERNAL <=====================

  async isExistedOpportunity(opportunityId: string): Promise<boolean> {
    const res = await this.opportunityModel.findById(opportunityId);
    return !!res?._id;
  }

  async getContactIdById(opportunityId: string): Promise<string | undefined> {
    const res = await this.opportunityModel.findById(opportunityId);
    return res?.toObject()?.contactId;
  }

  async getDetailById(opportunityId: string): Promise<Opportunity | undefined> {
    const res = await this.opportunityModel.findById(opportunityId);
    return res?.toObject();
  }
}
