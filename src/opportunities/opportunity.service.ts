import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, UpdateQuery } from 'mongoose';
import { Account } from 'src/accounts/account.schema';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { ContractService } from 'src/contracts/contract.service';
import { ContractResDto } from 'src/contracts/res/sub-dto';
import { ExistingSystemService } from 'src/existing-systems/existing-system.service';
import { ExistingSystemResDto } from 'src/existing-systems/res/existing-system.res.dto';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { FinancierService } from 'src/financiers/financier.service';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { PropertyService } from 'src/property/property.service';
import { QuotePartnerConfig } from 'src/quote-partner-configs/quote-partner-config.schema';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { QuoteService } from 'src/quotes/quote.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { TypicalBaselineParamsDto } from 'src/utilities/req/sub-dto/typical-baseline-params.dto';
import { Opportunity, OPPORTUNITY, UpdateOpportunityTitleNameMatchType } from './opportunity.schema';
import { GetFinancialSelectionsDto } from './res/financial-selection.dto';
import { GetRelatedInformationDto } from './res/get-related-information.dto';
import { QuoteDetailResDto } from './res/quote-detail.dto';
import { UpdateOpportunityRebateProgramDto as UpdateOpportunityRebateProgramDtoRes } from './res/update-opportunity-rebate-program.dto';
import { UpdateOpportunityTitleNameMatchDto as UpdateOpportunityTitleNameMatchDtoRes } from './res/update-opportunity-title-name-match.dto';
import { UpdateOpportunityUtilityProgramDto as UpdateOpportunityUtilityProgramDtoRes } from './res/update-opportunity-utility-program.dto';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectModel(OPPORTUNITY) private readonly opportunityModel: Model<Opportunity>,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    private readonly propertyService: PropertyService,
    private readonly quotePartnerConfigService: QuotePartnerConfigService,
    private readonly financierService: FinancierService,
    private readonly financialProductsService: FinancialProductsService,
    private readonly fundingSourceService: FundingSourceService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
    @Inject(forwardRef(() => ExistingSystemService))
    private readonly existingSystemService: ExistingSystemService,
  ) {}

  async getRelatedInformation(opportunityId: string): Promise<OperationResult<GetRelatedInformationDto>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId).lean();
    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    const [contact, property] = await Promise.all([
      this.contactService.getContactById(foundOpportunity.contactId),
      this.propertyService.findPropertyById(foundOpportunity.propertyId),
    ]);

    const data = {
      address: property?.address1 || '',
      city: property?.city || '',
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      opportunityId,
      state: property?.state || '',
      latitude: property?.lat || '',
      longitude: property?.lng || '',
      utilityProgramId: foundOpportunity.utilityProgramId ?? '',
      rebateProgramId: foundOpportunity.rebateProgramId ?? '',
      zipCode: property?.zip || '',
      partnerId: foundOpportunity.accountId,
      opportunityName: foundOpportunity.name,
      existingPV: !!foundOpportunity.existingPV,
      interconnectedWithExistingSystem: !!foundOpportunity.interconnectedWithExistingSystem,
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
      existingPVTilt: foundOpportunity.existingPVTilt,
      existingPVAzimuth: foundOpportunity.existingPVAzimuth,
      assignedMember: foundOpportunity.assignedMember,
      applicantName: foundOpportunity.applicantName,
      coapplicantName: foundOpportunity.coapplicantName,
      applicantCreditApproved: foundOpportunity.applicantCreditApproved,
      coapplicantCreditApproved: foundOpportunity.coapplicantCreditApproved,
      onTitleName: foundOpportunity.onTitleName,
      onTitleAddress: foundOpportunity.onTitleAddress,
      alternateTitleDocumentationSubmitted: foundOpportunity.alternateTitleDocumentationSubmitted,
      alternateTitleDocumentationSubmitDate: foundOpportunity.alternateTitleDocumentationSubmitDate,
      alternateTitleDocumentationName: foundOpportunity.alternateTitleDocumentationName,
      alternateTitleDocumentationAddress: foundOpportunity.alternateTitleDocumentationAddress,
      applicantNameMatchesTitle: foundOpportunity.applicantNameMatchesTitle,
      coapplicantNameMatchesTitle: foundOpportunity.coapplicantNameMatchesTitle,
      propertyId: foundOpportunity.propertyId,
    };

    return OperationResult.ok(strictPlainToClass(GetRelatedInformationDto, data));
  }

  async getAllExistingSystems(
    opportunityId: string,
    limit?: number,
    skip?: number,
  ): Promise<OperationResult<Pagination<ExistingSystemResDto>>> {
    const [res, count] = await this.existingSystemService.getAllAndCount(
      {
        opportunityId,
      },
      limit,
      skip,
    );

    return OperationResult.ok(
      new Pagination({
        data: strictPlainToClass(ExistingSystemResDto, res),
        total: count,
      }),
    );
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

    const updatedOpportunity = strictPlainToClass(UpdateOpportunityUtilityProgramDtoRes, savedOpportunity);

    // await this.quoteService.setOutdatedData(opportunityId, 'Utility Program');

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

    const updatedOpportunity = strictPlainToClass(UpdateOpportunityRebateProgramDtoRes, savedOpportunity);

    // await this.quoteService.setOutdatedData(opportunityId, 'Rebate Program');

    return OperationResult.ok(updatedOpportunity);
  }

  async updateOpportunityTitleNameMatch(
    opportunityId: string,
    titleNameMatchData: UpdateOpportunityTitleNameMatchType,
  ): Promise<OperationResult<UpdateOpportunityTitleNameMatchDtoRes>> {
    const foundOpportunity = await this.opportunityModel.findById(opportunityId);

    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    const savedOpportunity = await this.opportunityModel
      .findByIdAndUpdate(opportunityId, titleNameMatchData, { new: true })
      .lean();

    const updatedOpportunity = strictPlainToClass(UpdateOpportunityTitleNameMatchDtoRes, savedOpportunity);

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
      return OperationResult.ok(strictPlainToClass(GetFinancialSelectionsDto, {}));

    const financialProducts = await this.financialProductsService.getAllFinancialProductsByIds(
      quoteConfig.enabledFinancialProducts,
    );

    if (!financialProducts) {
      return OperationResult.ok(strictPlainToClass(GetFinancialSelectionsDto, {}));
    }

    const [financiers, fundingSources] = await Promise.all([
      this.financierService.getAllFinanciersByIds(financialProducts.map(e => e.financierId)),
      this.fundingSourceService.getFundingSourcesByIds(financialProducts.map(e => e.fundingSourceId)),
    ]);

    return OperationResult.ok(
      strictPlainToClass(GetFinancialSelectionsDto, {
        fundingSources,
        financiers,
      }),
    );
  }

  async getOppAccountData(opportunityId: string): Promise<LeanDocument<Account> | null> {
    const res = await this.opportunityModel.aggregate([
      {
        $match: {
          _id: opportunityId,
        },
      },
      {
        $lookup: {
          from: 'accounts',
          localField: 'accountId',
          foreignField: '_id',
          as: 'account',
        },
      },
      {
        $project: {
          account: {
            $arrayElemAt: ['$account', 0],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: '$account',
        },
      },
    ]);

    return res[0] || null;
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

  async getTypicalBaselineContactById(opportunityId: string): Promise<TypicalBaselineParamsDto> {
    const opportunity = await this.opportunityModel.findById(opportunityId).lean();
    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }
    const contact = await this.contactService.getContactById(opportunity.contactId);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return {
      zipCode: Number(contact.zip),
      addressString: contact.address1 || '',
      lat: contact?.lat || 0,
      lng: contact?.lng || 0,
      buildingType: 'singleFamilyDetached',
      excludeMeasures: false,
    };
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

  async getLatestPrimaryContract(opportunityId: string): Promise<OperationResult<ContractResDto>> {
    const contract = await this.contractService.getLatestPrimaryContractByOpportunity(opportunityId);

    return OperationResult.ok(contract);
  }

  async getQuoteDetail(opportunityId: string): Promise<OperationResult<QuoteDetailResDto>> {
    const contract = await this.contractService.getLatestPrimaryContractByOpportunity(opportunityId);
    const quoteDetail = await this.quoteService.getOneById(contract.associatedQuoteId);

    return OperationResult.ok(new QuoteDetailResDto(quoteDetail));
  }

  async getPartnerId(oppId: string): Promise<string> {
    const found = await this.opportunityModel.findOne({ _id: oppId }).lean();

    if (!found) {
      throw new NotFoundException(`No opportunity found with id ${oppId}`);
    }

    return found.accountId;
  }

  async getPartnerConfigFromOppId(oppId: string): Promise<LeanDocument<QuotePartnerConfig>> {
    const results = await this.opportunityModel.aggregate([
      {
        $match: {
          _id: oppId,
        },
      },
      {
        $lookup: {
          from: 'v2_quotePartnerConfig',
          localField: 'accountId',
          foreignField: 'partnerId',
          as: 'partnerConfigs',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $arrayElemAt: ['$partnerConfigs', 0],
          },
        },
      },
    ]);

    if (!results.length) {
      throw new NotFoundException(`No partner config found for opportunity ${oppId}`);
    }

    return results[0];
  }
}
