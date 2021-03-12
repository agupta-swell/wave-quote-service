import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { QuoteService } from 'src/quotes/quote.service';
import { Opportunity, OPPORTUNITY } from './opportunity.schema';
import { GetRelatedInformationDto } from './res/get-related-information.dto';
import { UpdateOpportunityUtilityProgramDto as UpdateOpportunityUtilityProgramDtoRes } from './res/update-opportunity-utility-program.dto';

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

  async updateOpportunityUtilityProgram(
    opportunityId: string,
    utilityProgramId: string,
  ): Promise<OperationResult<UpdateOpportunityUtilityProgramDtoRes>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId);

    if (!foundOpportunity) {
      throw ApplicationException.EnitityNotFound(opportunityId);
    }

    const savedOpportunity = await this.opportunityModel
      .findByIdAndUpdate(opportunityId, { utilityProgramId }, { new: true })
      .lean();

    const updatedOpportunity = new UpdateOpportunityUtilityProgramDtoRes(savedOpportunity as any);

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
    return res?.contactId;
  }

  async getDetailById(opportunityId: string): Promise<LeanDocument<Opportunity> | null> {
    const res = await this.opportunityModel.findById(opportunityId).lean();
    return res;
  }
}
