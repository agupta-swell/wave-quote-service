import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, UpdateQuery } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { FinancierService } from 'src/financier/financier.service';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { QuoteService } from 'src/quotes/quote.service';
import { Opportunity, OPPORTUNITY } from './opportunity.schema';
import { GetFinancialSelectionsDto } from './res/financial-selection.dto';
import { GetRelatedInformationDto } from './res/get-related-information.dto';
import { UpdateOpportunityRebateProgramDto as UpdateOpportunityRebateProgramDtoRes } from './res/update-opportunity-rebate-program.dto';
import { UpdateOpportunityUtilityProgramDto as UpdateOpportunityUtilityProgramDtoRes } from './res/update-opportunity-utility-program.dto';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectModel(OPPORTUNITY) private readonly opportunityModel: Model<Opportunity>,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    private readonly quotePartnerConfigService: QuotePartnerConfigService,
    private readonly financierService: FinancierService,
    private readonly financialProductsService: FinancialProductsService,
    private readonly fundingSourceService: FundingSourceService,
  ) {}

  async getRelatedInformation(opportunityId: string): Promise<OperationResult<GetRelatedInformationDto>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId).lean();
    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
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
      rebateProgramId: foundOpportunity.rebateProgramId ?? '',
      zipCode: contact?.zip || '',
      partnerId: foundOpportunity.accountId,
      opportunityName: foundOpportunity.name,
      existingPV: foundOpportunity.existingPV,
      hasGrantedHomeBatterySystemRights: foundOpportunity.hasGrantedHomeBatterySystemRights,
      hasHadOtherDemandResponseProvider: foundOpportunity.hasHadOtherDemandResponseProvider,
      originalInstaller: foundOpportunity.originalInstaller,
      existingPVSize: foundOpportunity.existingPVSize,
      yearSystemInstalled: foundOpportunity.yearSystemInstalled,
      inverter: foundOpportunity.inverter,
      financeType: foundOpportunity.financeType,
      inverterManufacturer: foundOpportunity.inverterManufacturer,
      inverterModel: foundOpportunity.inverterModel,
      tpoFundingSource: foundOpportunity.tpoFundingSource,
    };
    return OperationResult.ok(new GetRelatedInformationDto(data));
  }

  async updateOpportunityUtilityProgram(
    opportunityId: string,
    utilityProgramId: string,
  ): Promise<OperationResult<UpdateOpportunityUtilityProgramDtoRes>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId);

    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    const savedOpportunity = await this.opportunityModel
      .findByIdAndUpdate(opportunityId, { utilityProgramId }, { new: true })
      .lean();

    const updatedOpportunity = new UpdateOpportunityUtilityProgramDtoRes(savedOpportunity as any);

    await this.quoteService.setOutdatedData(opportunityId, 'Utility Program');

    return OperationResult.ok(updatedOpportunity);
  }

  async updateOpportunityRebateProgram(
    opportunityId: string,
    rebateProgramId: string,
  ): Promise<OperationResult<UpdateOpportunityRebateProgramDtoRes>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId);

    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    const savedOpportunity = await this.opportunityModel
      .findByIdAndUpdate(opportunityId, { rebateProgramId }, { new: true })
      .lean();

    const updatedOpportunity = new UpdateOpportunityRebateProgramDtoRes(savedOpportunity as any);

    await this.quoteService.setOutdatedData(opportunityId, 'Rebate Program');

    return OperationResult.ok(updatedOpportunity);
  }

  async getFinancialSelections(opportunityId: string): Promise<OperationResult<GetFinancialSelectionsDto>> {
    const opportunity = await this.opportunityModel.findById(opportunityId).lean();

    if (!opportunity) {
      throw ApplicationException.NotFoundStatus('Opportunity', opportunityId);
    }

    const { accountId: partnerId } = opportunity;

    const quoteConfig = await this.quotePartnerConfigService.getDetailByPartnerId(partnerId);

    if (!quoteConfig || !Array.isArray(quoteConfig.enabledFinancialProducts))
      return OperationResult.ok(new GetFinancialSelectionsDto({}));

    const financialProducts = await this.financialProductsService.getAllFinancialProductsByIds(
      quoteConfig.enabledFinancialProducts,
    );

    if (!financialProducts) {
      return OperationResult.ok(new GetFinancialSelectionsDto({}));
    }

    const [financiers, fundingSources] = await Promise.all([
      this.financierService.getAllFinanciersByIds(financialProducts.map(e => e.financier_id)),
      this.fundingSourceService.getFundingSourcesByIds(financialProducts.map(e => e.funding_source_id)),
    ]);

    return OperationResult.ok(
      new GetFinancialSelectionsDto({
        fundingSources,
        financiers,
      }),
    );
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

  async updateExistingOppDataById(
    opportunityId: string,
    updateQuery: UpdateQuery<Opportunity>,
  ): Promise<LeanDocument<Opportunity> | null> {
    const res = await this.opportunityModel.findByIdAndUpdate(opportunityId, updateQuery, { new: true }).lean();
    return res;
  }
}
