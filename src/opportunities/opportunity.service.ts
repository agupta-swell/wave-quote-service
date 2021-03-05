import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { QuoteService } from 'src/quotes/quote.service';
import { Opportunity, OPPORTUNITY } from './opportunity.schema';
import { UpdateOpportunityDto } from './req/update-opportunity.dto';
import { GetRelatedInformationDto } from './res/get-related-information.dto';
import { UpdateOpportunityDto as UpdateOpportunityDtoRes } from './res/update-opportunity.dto';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectModel(OPPORTUNITY) private readonly opportunityModel: Model<Opportunity>,
    private readonly quoteService: QuoteService,
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
      address: contact?.address1 || '',
      city: contact?.city || '',
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      opportunityId,
      state: contact?.state || '',
      utilityProgramId: foundOpportunity.utilityProgramId ?? '',
      zipCode: contact?.zip || '',
      partnerId: foundOpportunity.accountId,
    };
    return OperationResult.ok(new GetRelatedInformationDto(data));
  }

  async updateOpportunity(
    opportunityId: string,
    data: Omit<UpdateOpportunityDto, 'opportunityId'>,
  ): Promise<OperationResult<UpdateOpportunityDtoRes>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId);

    if (!foundOpportunity) {
      throw ApplicationException.EnitityNotFound(opportunityId);
    }

    const savedOpportunity = await this.opportunityModel.findByIdAndUpdate(opportunityId, data, { new: true });

    const updatedOpportunity = new UpdateOpportunityDtoRes(savedOpportunity?.toObject());

    await this.quoteService.setOutdatedData(opportunityId, 'Utility Program');

    return OperationResult.ok(updatedOpportunity);
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
