/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import { isNil, omit, omitBy, pickBy, sumBy } from 'lodash';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { STATUS_QUERY } from 'src/contracts/constants';
import { ContractService } from 'src/contracts/contract.service';
import { DiscountService } from 'src/discounts/discount.service';
import { IExistingSystem } from 'src/existing-systems/interfaces';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { GsProgramsService } from 'src/gs-programs/gs-programs.service';
import { IGetDetail } from 'src/lease-solver-configs/typing';
import { ManufacturerService } from 'src/manufacturers/manufacturer.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { PromotionService } from 'src/promotions/promotion.service';
import { ProposalService } from 'src/proposals/proposal.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { RebateProgram } from 'src/rebate-programs/rebate-programs.schema';
import { RebateProgramService } from 'src/rebate-programs/rebate-programs.service';
import { assignToModel } from 'src/shared/transform/assignToModel';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { FINANCE_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';
import { SystemProductionService } from 'src/system-productions/system-production.service';
import { ITaxCreditConfigSnapshot } from 'src/tax-credit-configs/interfaces';
import { TaxCreditConfigService } from 'src/tax-credit-configs/tax-credit-config.service';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { getBooleanString } from 'src/utils/common';
import { roundNumber } from 'src/utils/transformNumber';
import { OperationResult, Pagination } from '../app/common';
import { CashPaymentConfigService } from '../cash-payment-configs/cash-payment-config.service';
import { LeaseSolverConfigService } from '../lease-solver-configs/lease-solver-config.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { FINANCE_PRODUCT_TYPE, PRIMARY_QUOTE_TYPE, QUOTE_MODE_TYPE, REBATE_TYPE } from './constants';
import { IQuoteCostBuildup } from './interfaces';
import {
  ICashProductAttributes,
  IDetailedQuoteSchema,
  IEsaProductAttributes,
  ILeaseProductAttributes,
  ILoanProductAttributes,
  IRebateDetailsSchema,
  IRebateProgramSchema,
  Quote,
  QUOTE,
  QuoteModel,
} from './quote.schema';
import {
  CalculateQuoteDetailDto,
  CashProductAttributesDto,
  CreateQuoteDto,
  LeaseProductAttributesDto,
  LeaseQuoteValidationDto,
  LoanProductAttributesDto,
  QuoteFinanceProductDto,
  UpdateLatestQuoteDto,
  UpdateQuoteDto,
} from './req';
import { QuoteDto } from './res';
import { QuoteCostBuildupUserInputDto } from './res/sub-dto';
import { I_T_C, ITC } from './schemas';
import { CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService } from './sub-services';
import { ICreateProductAttribute } from './typing';
import { EsaProductAttributesDto } from './req/sub-dto/esa-product-attributes.dto';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(QUOTE) private readonly quoteModel: Model<Quote>,
    @InjectModel(I_T_C) private readonly iTCModel: Model<ITC>,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly utilityProgramService: UtilityProgramMasterService,
    private readonly fundingSourceService: FundingSourceService,
    @Inject(forwardRef(() => FinancialProductsService))
    private readonly financialProductService: FinancialProductsService,
    private readonly cashPaymentConfigService: CashPaymentConfigService,
    @Inject(forwardRef(() => CalculationService))
    private readonly calculationService: CalculationService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
    private readonly quotePartnerConfigService: QuotePartnerConfigService,
    private readonly rebateProgramService: RebateProgramService,
    @Inject(forwardRef(() => ProposalService))
    private readonly proposalService: ProposalService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
    private readonly manufacturerService: ManufacturerService,
    @Inject(forwardRef(() => QuoteCostBuildUpService))
    private readonly quoteCostBuildUpService: QuoteCostBuildUpService,
    @Inject(forwardRef(() => QuoteFinanceProductService))
    private readonly quoteFinanceProductService: QuoteFinanceProductService,
    private readonly taxCreditConfigService: TaxCreditConfigService,
    private readonly gsProgramsService: GsProgramsService,
    private readonly systemProductionService: SystemProductionService,
  ) {}

  async createQuote(data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const [
      systemDesign,
      quoteConfigData,
      taxCreditData,
      opportunityRelatedInformation,
      utilityData,
    ] = await Promise.all([
      this.systemDesignService.getOneById(data.systemDesignId),
      this.quotePartnerConfigService.getDetailByPartnerId(data.partnerId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(data.opportunityId),
      this.utilityService.getUtilityByOpportunityId(data.opportunityId),
    ]);

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('System Design');
    }

    const systemProduction = await this.systemProductionService.findById(systemDesign.systemProductionId);

    if (!systemProduction) {
      throw ApplicationException.EntityNotFound('System Production');
    }

    if (!systemDesign.roofTopDesignData.storage.length && !systemDesign.roofTopDesignData.panelArray.length) {
      throw ApplicationException.UnprocessableEntity('Can not create quote from empty system design');
    }

    if (systemDesign.isSolar && !systemDesign.roofTopDesignData.inverters.length) {
      throw ApplicationException.UnprocessableEntity('Inverters are required on PV system designs!');
    }

    if (!utilityData) {
      throw ApplicationException.EntityNotFound('Utility Data');
    }

    if (
      !quoteConfigData ||
      (!quoteConfigData.enableCostBuildup &&
        !quoteConfigData.enablePricePerWatt &&
        !quoteConfigData.enablePriceOverride)
    ) {
      throw ApplicationException.NoQuoteConfigAvailable();
    }

    const utilityProgram = data.utilityProgramId
      ? await this.utilityProgramService.getDetailById(data.utilityProgramId)
      : null;

    const rebateProgram = data.rebateProgramId
      ? await this.rebateProgramService.getOneById(data.rebateProgramId)
      : null;

    const financialProduct = await this.financialProductService.getDetailByFinancialProductId(data.financialProductId);
    if (!financialProduct) {
      throw ApplicationException.EntityNotFound('financial Source');
    }

    const fundingSource = await this.fundingSourceService.getDetailById(data.fundingSourceId);
    if (!fundingSource) {
      throw ApplicationException.EntityNotFound('Product Type');
    }

    const dealerFeePercentage = await this.getDealerFeePercentage(fundingSource.type, financialProduct.dealerFee);

    const quoteCostBuildup = this.quoteCostBuildUpService.create({
      roofTopDesignData: systemDesign.roofTopDesignData,
      partnerMarkup: quoteConfigData,
      dealerFeePercentage,
    });

    if (data.selectedQuoteMode === QUOTE_MODE_TYPE.PRICE_PER_WATT) {
      quoteCostBuildup.projectGrandTotal.netCost = data.quotePricePerWatt.grossPrice;
      quoteCostBuildup.projectGrossTotal.netCost = data.quotePricePerWatt.grossPrice;
    } else if (data.selectedQuoteMode === QUOTE_MODE_TYPE.PRICE_OVERRIDE) {
      quoteCostBuildup.projectGrandTotal.netCost = data.quotePriceOverride.grossPrice;
      quoteCostBuildup.projectGrossTotal.netCost = data.quotePriceOverride.grossPrice;
    }

    const primaryQuoteType = this.getPrimaryQuoteType(quoteCostBuildup, systemDesign.existingSystem);

    const { minDownPayment, maxDownPayment, maxDownPaymentPercentage } = financialProduct;

    const currentAnnualCost =
      utilityData.costData.computedCost.annualCost ?? sumBy(utilityData.costData.computedCost.cost, item => item.v);
    const postInstallAnnualCost = systemDesign.costPostInstallation
      ? systemDesign.costPostInstallation
      : currentAnnualCost;

    const currentAverageMonthlyBill = roundNumber(currentAnnualCost / 12, 2) || 0;
    const currentPricePerKWh =
      roundNumber(currentAnnualCost / utilityData.utilityData.computedUsage.annualConsumption, 2) || 0;
    const newAverageMonthlyBill = roundNumber(postInstallAnnualCost / 12, 2) || 0;
    const newPricePerKWh = roundNumber(postInstallAnnualCost / utilityData.totalPlannedUsageIncreases, 2) || 0;

    const productAttribute = await this.createProductAttribute({
      productType: fundingSource.type,
      netAmount: quoteCostBuildup.projectGrandTotal.netCost,
      financialProductSnapshot: financialProduct,
      currentPricePerKWh,
      newPricePerKWh,
      currentAverageMonthlyBill,
      newAverageMonthlyBill,
      capacityKW: systemProduction.data?.capacityKW || 0,
    });

    productAttribute.upfrontPayment = this.calculateUpfrontPayment(
      minDownPayment,
      maxDownPayment,
      maxDownPaymentPercentage,
      quoteCostBuildup.projectGrandTotal.netCost || 0,
      productAttribute.upfrontPayment,
    );

    const detailedQuote = {
      systemProductionId: systemDesign.systemProductionId,
      primaryQuoteType,
      quoteCostBuildup,
      rebateProgram,
      utilityProgram: utilityProgram && {
        utilityProgramId: utilityProgram._id.toString(),
        utilityProgramName: utilityProgram.utilityProgramName,
        utilityProgramDataSnapshot: utilityProgram,
        utilityProgramDataSnapshotDate: new Date(),
      },
      quoteFinanceProduct: {
        financeProduct: {
          productType: fundingSource.type,
          fundingSourceId: fundingSource.id,
          fundingSourceName: fundingSource.name,
          productAttribute,
          financialProductSnapshot: financialProduct,
        },
        netAmount: quoteCostBuildup.projectGrandTotal.netCost,
        incentiveDetails: [],
        rebateDetails: await this.createRebateDetails(rebateProgram, fundingSource.rebateAssignment),
        projectDiscountDetails: [],
        promotionDetails: [],
      },
      utilityProgramSelectedForReinvestment: false,
      taxCreditSelectedForReinvestment: false,
      savingsDetails: [],
      isSelected: false,
      isSolar: systemDesign.isSolar,
      isRetrofit: systemDesign.isRetrofit,
      quoteName: data.quoteName,
      allowedQuoteModes: data.allowedQuoteModes || [],
      selectedQuoteMode: data.selectedQuoteMode,
      quotePricePerWatt: data.quotePricePerWatt,
      quotePriceOverride: data.quotePriceOverride,
      notes: [],
    };

    if (quoteConfigData) {
      if (quoteConfigData.enableCostBuildup) {
        detailedQuote.allowedQuoteModes.push(QUOTE_MODE_TYPE.COST_BUILD_UP);
      }

      if (quoteConfigData.enablePricePerWatt) {
        detailedQuote.allowedQuoteModes.push(QUOTE_MODE_TYPE.PRICE_PER_WATT);
      }

      if (quoteConfigData.enablePriceOverride) {
        detailedQuote.allowedQuoteModes.push(QUOTE_MODE_TYPE.PRICE_OVERRIDE);
      }
    }

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(true);

    const obj = new this.quoteModel(model);

    const opportunityState = opportunityRelatedInformation?.data?.state;
    obj.detailedQuote.taxCreditData = taxCreditData
      .filter(
        ({ isFederal, stateCode, applicableQuoteTypes }) =>
          applicableQuoteTypes?.includes(primaryQuoteType) &&
          (isFederal || (stateCode && opportunityState && stateCode === opportunityState)),
      )
      .map(taxCredit => TaxCreditConfigService.snapshot(taxCredit, quoteCostBuildup.projectGrandTotal.netCost ?? 0));

    obj.detailedQuote.quoteFinanceProduct.projectDiscountDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    obj.detailedQuote.quoteFinanceProduct.promotionDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    obj.detailedQuote.quoteFinanceProduct.incentiveDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    await obj.save();

    return OperationResult.ok(strictPlainToClass(QuoteDto, obj.toJSON()));
  }

  async reQuote(quoteId: ObjectId, systemDesignId: string) {
    const foundQuote = await this.quoteModel.findById(quoteId).lean();
    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId.toString());
    }

    const foundSystemDesign = await this.systemDesignService.getOneById(systemDesignId);

    if (!foundSystemDesign || foundSystemDesign.opportunityId !== foundQuote.opportunityId) {
      throw new NotFoundException('System design not found');
    }

    if (foundSystemDesign.isSolar && !foundSystemDesign.roofTopDesignData.inverters.length) {
      throw ApplicationException.UnprocessableEntity('Inverters are required on PV system designs!');
    }

    let gsPrograms;
    if (
      foundQuote.detailedQuote.quoteCostBuildup.storageQuoteDetails.length &&
      foundSystemDesign.roofTopDesignData.storage.length
    ) {
      gsPrograms = foundQuote.detailedQuote.utilityProgram?.utilityProgramId
        ? await this.gsProgramsService.getList(
            100,
            0,
            foundQuote.detailedQuote.utilityProgram.utilityProgramId,
            systemDesignId,
          )
        : [];
    }

    if (foundQuote.systemDesignId !== systemDesignId) {
      const currentGsProgram = gsPrograms?.data?.data?.find(
        gsProgram =>
          gsProgram.id ===
          foundQuote.detailedQuote.quoteFinanceProduct.incentiveDetails[0]?.detail?.gsProgramSnapshot?.id,
      );
      if (!currentGsProgram) {
        foundQuote.detailedQuote.quoteCostBuildup.totalPromotionsDiscountsAndSwellGridrewards = {
          cogsAmount: 0,
          marginAmount: 0,
          total: 0,
        };
        foundQuote.detailedQuote.quoteFinanceProduct.incentiveDetails = [];
      }
    }

    const [markupConfig, taxCreditData, opportunityRelatedInformation, utilityData] = await Promise.all([
      this.opportunityService.getPartnerConfigFromOppId(foundQuote.opportunityId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(foundQuote.opportunityId),
      this.utilityService.getUtilityByOpportunityId(foundQuote.opportunityId),
    ]);

    if (!utilityData) {
      throw ApplicationException.EntityNotFound('Utility Data');
    }

    const newDoc = omit(foundQuote, ['_id', 'createdAt', 'updatedAt']);

    const validDiscounts = newDoc.detailedQuote.quoteFinanceProduct.projectDiscountDetails.filter(
      DiscountService.validate,
    );

    const validPromotions = newDoc.detailedQuote.quoteFinanceProduct.promotionDetails.filter(PromotionService.validate);

    newDoc.detailedQuote.quoteFinanceProduct.projectDiscountDetails = validDiscounts;

    newDoc.detailedQuote.quoteFinanceProduct.promotionDetails = validPromotions;

    const model = new this.quoteModel(newDoc);

    const originQuoteName = foundQuote.detailedQuote.quoteName.replace(/\s\([0-9]*(\)$)/, '');

    const totalSameNameQuotes = await this.quoteModel.countDocuments({
      opportunity_id: foundQuote.opportunityId,
      system_design_id: systemDesignId,
      'detailed_quote.quote_name': { $regex: originQuoteName },
    });

    model.systemDesignId = systemDesignId;
    model.detailedQuote.quoteName = `${originQuoteName} ${
      totalSameNameQuotes ? `(${totalSameNameQuotes + 1})` : ''
    }`.trim();
    model.detailedQuote.systemProductionId = foundSystemDesign.systemProductionId;

    const { selectedQuoteMode, quotePricePerWatt, quotePriceOverride } = foundQuote.detailedQuote;

    model.detailedQuote.selectedQuoteMode = selectedQuoteMode;

    const systemProduction = await this.systemProductionService.findById(foundSystemDesign.systemProductionId);

    if (systemProduction.data && quotePricePerWatt) {
      model.detailedQuote.quotePricePerWatt = {
        pricePerWatt: foundQuote.detailedQuote.quotePricePerWatt.pricePerWatt,
        grossPrice: foundQuote.detailedQuote.quotePricePerWatt.pricePerWatt * systemProduction.data.capacityKW * 1000,
      };
    }

    if (quotePriceOverride) {
      model.detailedQuote.quotePriceOverride = {
        grossPrice: quotePriceOverride.grossPrice,
      };
    }

    const {
      financeProduct,
      financeProduct: { financialProductSnapshot },
    } = foundQuote.detailedQuote.quoteFinanceProduct;

    const fundingSource = await this.fundingSourceService.getDetailById(financeProduct.fundingSourceId);
    if (!fundingSource) {
      throw ApplicationException.EntityNotFound('Product Type');
    }
    const { dealerFee } = financialProductSnapshot;
    const dealerFeePercentage = await this.getDealerFeePercentage(fundingSource.type, dealerFee);

    const quoteCostBuildup = this.quoteCostBuildUpService.create({
      roofTopDesignData: foundSystemDesign.roofTopDesignData,
      partnerMarkup: markupConfig,
      userInputs: foundQuote.detailedQuote.quoteCostBuildup,
      dealerFeePercentage,
      discountsPromotionsAndIncentives: {
        discounts: foundQuote.detailedQuote.quoteFinanceProduct.projectDiscountDetails,
        promotions: foundQuote.detailedQuote.quoteFinanceProduct.promotionDetails,
        incentives: foundQuote.detailedQuote.quoteFinanceProduct.incentiveDetails,
      },
    });

    model.detailedQuote.quoteCostBuildup = quoteCostBuildup;

    const primaryQuoteType = this.getPrimaryQuoteType(quoteCostBuildup, foundSystemDesign.existingSystem);

    model.detailedQuote.primaryQuoteType = primaryQuoteType;

    let currentProjectPrice: number;

    switch (selectedQuoteMode) {
      case QUOTE_MODE_TYPE.COST_BUILD_UP:
        currentProjectPrice = model.detailedQuote.quoteCostBuildup?.projectGrandTotal.netCost || 0;
        break;
      case QUOTE_MODE_TYPE.PRICE_PER_WATT:
        currentProjectPrice = model.detailedQuote.quotePricePerWatt?.grossPrice || 0;
        break;
      case QUOTE_MODE_TYPE.PRICE_OVERRIDE:
        currentProjectPrice = model.detailedQuote.quotePriceOverride?.grossPrice || 0;
        break;
      default:
        currentProjectPrice = 0;
    }

    const currentAnnualCost =
      utilityData.costData.computedCost.annualCost ?? sumBy(utilityData.costData.computedCost.cost, item => item.v);

    const postInstallAnnualCost = foundSystemDesign.costPostInstallation
      ? foundSystemDesign.costPostInstallation
      : currentAnnualCost;

    const currentAverageMonthlyBill = roundNumber(currentAnnualCost / 12, 2) || 0;
    const currentPricePerKWh =
      roundNumber(currentAnnualCost / utilityData.utilityData.computedUsage.annualConsumption, 2) || 0;
    const newAverageMonthlyBill = roundNumber(postInstallAnnualCost / 12, 2) || 0;
    const newPricePerKWh = roundNumber(postInstallAnnualCost / utilityData.totalPlannedUsageIncreases, 2) || 0;

    const financeProductAttribute = (financeProduct.productAttribute as unknown) as IEsaProductAttributes;

    let productAttribute = await this.createProductAttribute({
      productType: financeProduct.productType,
      netAmount: currentProjectPrice,
      financialProductSnapshot,
      currentPricePerKWh,
      newPricePerKWh,
      currentAverageMonthlyBill,
      newAverageMonthlyBill,
      capacityKW: systemProduction.data?.capacityKW || 0,
      esaTerm: financeProductAttribute.esaTerm,
      rateEscalator: financeProductAttribute.rateEscalator,
    });

    const { productAttribute: product_attribute } = financeProduct as any;

    // WAV-2148 disable due to validation failure
    // const avgMonthlySavings = await this.calculateAvgMonthlySavings(foundSystemDesign.opportunityId, foundSystemDesign);
    const avgMonthlySavings = 0;

    switch (financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE: {
        productAttribute = {
          ...productAttribute,
          rateEscalator: product_attribute.rateEscalator,
          leaseTerm: product_attribute.leaseTerm,
          monthlyUtilityPayment: productAttribute.currentMonthlyAverageUtilityPayment - avgMonthlySavings,
        } as LeaseProductAttributesDto;
        break;
      }
      case FINANCE_PRODUCT_TYPE.LOAN: {
        productAttribute = {
          ...productAttribute,
          interestRate: product_attribute.interestRate,
          upfrontPayment: product_attribute.upfrontPayment,
          loanTerm: product_attribute.loanTerm,
          monthlyUtilityPayment: productAttribute.currentMonthlyAverageUtilityPayment - avgMonthlySavings,
        } as LoanProductAttributesDto;
        break;
      }
      case FINANCE_PRODUCT_TYPE.ESA: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
        } as EsaProductAttributesDto;
        break;
      }

      default: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
        } as CashProductAttributesDto;
        break;
      }
    }

    const { minDownPayment, maxDownPayment, maxDownPaymentPercentage } = financeProduct.financialProductSnapshot;

    productAttribute.upfrontPayment = this.calculateUpfrontPayment(
      minDownPayment,
      maxDownPayment,
      maxDownPaymentPercentage,
      quoteCostBuildup.projectGrandTotal.netCost || 0,
      productAttribute.upfrontPayment,
    );

    model.detailedQuote.quoteFinanceProduct.financeProduct.productAttribute = productAttribute;

    const rebateDetails = await this.createRebateDetails(
      foundQuote.detailedQuote.rebateProgram,
      fundingSource?.rebateAssignment || '',
      foundQuote.detailedQuote.quoteFinanceProduct.rebateDetails,
    );

    const { quoteFinanceProduct } = model.detailedQuote;

    quoteFinanceProduct.rebateDetails.forEach(e => {
      const { type } = e;

      const foundIdx = rebateDetails.findIndex(e => e.type === type);

      if (foundIdx === -1) {
        rebateDetails.push(e);
        return;
      }

      if (!rebateDetails[foundIdx].amount) {
        rebateDetails[foundIdx] = e;
      }
    });

    model.detailedQuote.quoteFinanceProduct.rebateDetails = rebateDetails;

    const opportunityState = opportunityRelatedInformation?.data?.state;
    model.detailedQuote.taxCreditData = taxCreditData
      .filter(
        ({ isFederal, stateCode, applicableQuoteTypes }) =>
          applicableQuoteTypes?.includes(primaryQuoteType) &&
          (isFederal || (stateCode && opportunityState && stateCode === opportunityState)),
      )
      .map(taxCredit => TaxCreditConfigService.snapshot(taxCredit, quoteCostBuildup.projectGrandTotal.netCost ?? 0));

    model.detailedQuote.quoteFinanceProduct.projectDiscountDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    model.detailedQuote.quoteFinanceProduct.promotionDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    model.detailedQuote.quoteFinanceProduct.incentiveDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    assignToModel(
      model.detailedQuote.quoteFinanceProduct,
      <any>this.handleUpdateQuoteFinanceProduct(
        {
          financeProduct: quoteFinanceProduct.financeProduct,
          incentiveDetails: quoteFinanceProduct.incentiveDetails,
          netAmount: quoteFinanceProduct.netAmount,
          projectDiscountDetails: quoteFinanceProduct.projectDiscountDetails,
          rebateDetails: quoteFinanceProduct.rebateDetails,
          promotionDetails: quoteFinanceProduct.promotionDetails,
        } as any,
        model.detailedQuote.quoteCostBuildup,
        currentProjectPrice,
      ),
    );

    if ('reinvestment' in foundQuote.detailedQuote.quoteFinanceProduct.financeProduct.productAttribute) {
      (<ILoanProductAttributes>model.detailedQuote.quoteFinanceProduct.financeProduct.productAttribute).reinvestment = [
        this.calculateMaxReinvestmentAmount(
          model.detailedQuote.taxCreditSelectedForReinvestment,
          model.detailedQuote.taxCreditData,
          model.detailedQuote.utilityProgramSelectedForReinvestment,
          rebateDetails.find(e => e.type === REBATE_TYPE.SGIP),
          model.detailedQuote.quoteFinanceProduct.netAmount,
          foundQuote.detailedQuote.quoteFinanceProduct.financeProduct.productAttribute.reinvestment[0]
            ?.reinvestmentAmount,
        ),
      ];
    }

    await model.save();

    return OperationResult.ok(strictPlainToClass(QuoteDto, model.toJSON()));
  }

  async createProductAttribute({
    productType,
    netAmount,
    financialProductSnapshot,
    currentPricePerKWh = 0,
    newPricePerKWh = 0,
    currentAverageMonthlyBill = 0,
    newAverageMonthlyBill = 0,
    capacityKW,
    esaTerm = 20,
    rateEscalator = 0.9,
  }: ICreateProductAttribute): Promise<any> {
    // TODO: Refactor this function with correct params and default value.
    let template: ILoanProductAttributes | ILeaseProductAttributes | ICashProductAttributes | IEsaProductAttributes;

    const { defaultDownPayment, interestRate, terms, termMonths } = financialProductSnapshot;

    switch (productType) {
      case FINANCE_PRODUCT_TYPE.LOAN:
        template = {
          upfrontPayment: defaultDownPayment,
          loanAmount: netAmount,
          loanStartDate: new Date(new Date().setDate(1)),
          terms,
          interestRate,
          loanTerm: termMonths,
          taxCreditPrepaymentAmount: 0,
          willingToPayThroughAch: false,
          monthlyLoanPayment: this.calculationService.monthlyPaymentAmount(netAmount, interestRate, termMonths),
          currentMonthlyAverageUtilityPayment: 0,
          monthlyUtilityPayment: 0,
          gridServicePayment: 0,
          netCustomerEnergySpend: 0,
          returnOnInvestment: 0,
          payBackPeriod: 0,
          currentPricePerKWh,
          newPricePerKWh,
          yearlyLoanPaymentDetails: [],
          reinvestment: [],
          currentAverageMonthlyBill,
          newAverageMonthlyBill,
        } as ILoanProductAttributes;
        return template;

      case FINANCE_PRODUCT_TYPE.LEASE:
        template = {
          upfrontPayment: 0,
          leaseAmount: netAmount,
          leaseTerm: 25,
          monthlyLeasePayment: 0,
          currentMonthlyAverageUtilityPayment: 0,
          monthlyUtilityPayment: 0,
          monthlyEnergyPayment: 0,
          gridServicePayment: 0,
          netCustomerEnergySpend: 0,
          rateEscalator: 0,
          currentPricePerKWh,
          newPricePerKWh,
          yearlyLeasePaymentDetails: [],
          ratePerKWh: 0,
        } as ILeaseProductAttributes;
        return template;

      case FINANCE_PRODUCT_TYPE.ESA:
        template = {
          upfrontPayment: defaultDownPayment,
          balance: netAmount,
          milestonePayment: [],
          currentAverageMonthlyBill,
          newAverageMonthlyBill,
          currentPricePerKWh,
          newPricePerKWh,
          esaTerm,
          rateEscalator,
          grossFinancePayment: this.calculationService.calculateGrossFinancePayment(
            rateEscalator,
            esaTerm,
            capacityKW,
            netAmount,
          ),
        } as IEsaProductAttributes;
        return template;

      default: {
        const cashQuoteConfig = await this.cashPaymentConfigService.getFirst();
        template = {
          upfrontPayment: defaultDownPayment,
          balance: netAmount,
          milestonePayment: (cashQuoteConfig?.config || []).map(item => ({
            ...item,
            amount: roundNumber(netAmount * item.percentage, 2),
          })),
          cashQuoteConfigSnapshot: {
            type: cashQuoteConfig?.type,
            config: cashQuoteConfig?.config,
          },
          currentAverageMonthlyBill,
          newAverageMonthlyBill,
          currentPricePerKWh,
          newPricePerKWh,
          cashQuoteConfigSnapshotDate: new Date(),
        } as ICashProductAttributes;
        return template;
      }
    }
  }

  async updateLatestQuote(data: UpdateLatestQuoteDto, quoteId: string): Promise<OperationResult<QuoteDto>> {
    const isInUsed = await this.checkInUsed(quoteId);

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    const [
      foundQuote,
      systemDesign,
      quotePartnerConfig,
      taxCreditData,
      opportunityRelatedInformation,
      utilityData,
    ] = await Promise.all([
      this.quoteModel.findById(quoteId).lean(),
      this.systemDesignService.getOneById(data.systemDesignId),
      this.quotePartnerConfigService.getDetailByPartnerId(data.partnerId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(data.opportunityId),
      this.utilityService.getUtilityByOpportunityId(data.opportunityId),
    ]);

    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId);
    }

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('system Design');
    }

    if (!systemDesign.roofTopDesignData.panelArray.length) {
      throw ApplicationException.UnprocessableEntity('Can not recalculate quote from empty system design');
    }

    if (systemDesign.isSolar && !systemDesign.roofTopDesignData.inverters.length) {
      throw ApplicationException.UnprocessableEntity('Inverters are required on PV system designs!');
    }

    const systemProduction = await this.systemProductionService.findById(systemDesign.systemProductionId);
    if (!systemProduction) {
      throw ApplicationException.EntityNotFound('System Production');
    }

    if (!quotePartnerConfig) {
      throw new NotFoundException('No quote partner config');
    }

    if (!utilityData) {
      throw ApplicationException.EntityNotFound('Utility Data');
    }

    const opportunityState = opportunityRelatedInformation?.data?.state;

    const {
      quoteFinanceProduct: {
        incentiveDetails,
        rebateDetails,
        financeProduct,
        promotionDetails,
        projectDiscountDetails,
      },
      utilityProgram,
      rebateProgram,
    } = foundQuote.detailedQuote;

    const { financialProductSnapshot } = financeProduct;
    const { minDownPayment, maxDownPayment, maxDownPaymentPercentage, dealerFee } = financialProductSnapshot;

    const fundingSource = await this.fundingSourceService.getDetailById(financeProduct.fundingSourceId);
    if (!fundingSource) {
      throw ApplicationException.EntityNotFound('Product Type');
    }

    const dealerFeePercentage = await this.getDealerFeePercentage(fundingSource.type, dealerFee);

    const quoteCostBuildup = this.quoteCostBuildUpService.create({
      roofTopDesignData: systemDesign.roofTopDesignData,
      partnerMarkup: quotePartnerConfig,
      dealerFeePercentage,
      userInputs: foundQuote.detailedQuote.quoteCostBuildup,
      discountsPromotionsAndIncentives: {
        discounts: foundQuote.detailedQuote.quoteFinanceProduct.projectDiscountDetails,
        promotions: foundQuote.detailedQuote.quoteFinanceProduct.promotionDetails,
        incentives: foundQuote.detailedQuote.quoteFinanceProduct.incentiveDetails,
      },
    });

    const primaryQuoteType = this.getPrimaryQuoteType(quoteCostBuildup, systemDesign.existingSystem);

    // WAV-2148 disable due to validation failure
    // const avgMonthlySavings = await this.calculateAvgMonthlySavings(data.opportunityId, systemDesign);
    const avgMonthlySavings = 0;

    const currentAnnualCost =
      utilityData.costData.computedCost.annualCost ?? sumBy(utilityData.costData.computedCost.cost, item => item.v);

    const postInstallAnnualCost = systemDesign.costPostInstallation
      ? systemDesign.costPostInstallation
      : currentAnnualCost;

    const currentAverageMonthlyBill = roundNumber(currentAnnualCost / 12, 2) || 0;
    const currentPricePerKWh =
      roundNumber(currentAnnualCost / utilityData.utilityData.computedUsage.annualConsumption, 2) || 0;
    const newAverageMonthlyBill = roundNumber(postInstallAnnualCost / 12, 2) || 0;
    const newPricePerKWh = roundNumber(postInstallAnnualCost / utilityData.totalPlannedUsageIncreases, 2) || 0;

    const { productAttribute: product_attribute } = financeProduct as any;

    let productAttribute = await this.createProductAttribute({
      productType: financeProduct.productType,
      netAmount: quoteCostBuildup.projectGrandTotal.netCost,
      financialProductSnapshot,
      currentPricePerKWh,
      newPricePerKWh,
      currentAverageMonthlyBill,
      newAverageMonthlyBill,
      capacityKW: systemProduction.data?.capacityKW || 0,
      esaTerm: product_attribute.esaTerm,
      rateEscalator: product_attribute.rateEscalator,
    });

    switch (financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE: {
        productAttribute = {
          ...productAttribute,
          rateEscalator: product_attribute.rateEscalator,
          leaseTerm: product_attribute.leaseTerm,
          monthlyUtilityPayment: productAttribute.currentMonthlyAverageUtilityPayment - avgMonthlySavings,
        } as LeaseProductAttributesDto;
        break;
      }
      case FINANCE_PRODUCT_TYPE.LOAN: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
          interestRate: product_attribute.interestRate,
          loanTerm: product_attribute.loanTerm,
          monthlyUtilityPayment: productAttribute.currentMonthlyAverageUtilityPayment - avgMonthlySavings,
        } as LoanProductAttributesDto;
        break;
      }
      case FINANCE_PRODUCT_TYPE.ESA: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
        } as EsaProductAttributesDto;
        break;
      }

      default: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
        } as CashProductAttributesDto;
        break;
      }
    }

    productAttribute.upfrontPayment = this.calculateUpfrontPayment(
      minDownPayment,
      maxDownPayment,
      maxDownPaymentPercentage,
      quoteCostBuildup.projectGrandTotal.netCost || 0,
      productAttribute.upfrontPayment,
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    // eslint-disable-next-line func-names
    const handledIncentiveDetails = (function () {
      const { storageQuoteDetails } = quoteCostBuildup;
      const storageQuoteDetailsOfQuote = foundQuote.detailedQuote?.quoteCostBuildup?.storageQuoteDetails;

      if (!storageQuoteDetails?.length || !storageQuoteDetailsOfQuote?.length) {
        return [];
      }
      const newManufacturerId = storageQuoteDetails[0].storageModelDataSnapshot.manufacturerId.toString();
      const oldManufacturerId = storageQuoteDetailsOfQuote[0].storageModelDataSnapshot.manufacturerId.toString();

      if (newManufacturerId !== oldManufacturerId) return [];

      const newStorageSize =
        storageQuoteDetails[0].quantity * storageQuoteDetails[0].storageModelDataSnapshot.ratings.kilowattHours;
      const oldStorageSize =
        storageQuoteDetailsOfQuote[0].quantity *
        storageQuoteDetailsOfQuote[0].storageModelDataSnapshot.ratings.kilowattHours;

      if (newStorageSize !== oldStorageSize) return [];

      return incentiveDetails;
    })();

    const detailedQuote = {
      systemProductionId: systemDesign.systemProductionId,
      primaryQuoteType,
      quoteCostBuildup,
      rebateProgram,
      utilityProgram,
      quoteFinanceProduct: {
        financeProduct: {
          productType: financeProduct.productType,
          fundingSourceId: financeProduct.fundingSourceId,
          fundingSourceName: financeProduct.fundingSourceName,
          productAttribute,
          financialProductSnapshot: financeProduct.financialProductSnapshot,
        },
        netAmount: quoteCostBuildup.projectGrandTotal.netCost,
        incentiveDetails: handledIncentiveDetails,
        rebateDetails,
        projectDiscountDetails:
          data.quoteFinanceProduct?.projectDiscountDetails ?? projectDiscountDetails.filter(DiscountService.validate),
        promotionDetails:
          data.quoteFinanceProduct?.promotionDetails ?? promotionDetails.filter(PromotionService.validate),
      },
      taxCreditSelectedForReinvestment: foundQuote.detailedQuote.taxCreditSelectedForReinvestment,
      utilityProgramSelectedForReinvestment: foundQuote.detailedQuote.utilityProgramSelectedForReinvestment,
      savingsDetails: [],
      quoteName: foundQuote.detailedQuote.quoteName,
      isSelected: foundQuote.detailedQuote.isSelected,
      isSolar: foundQuote.detailedQuote.isSolar,
      isRetrofit: foundQuote.detailedQuote.isRetrofit,
      selectedQuoteMode: foundQuote.detailedQuote.selectedQuoteMode,
      allowedQuoteModes: foundQuote.detailedQuote.allowedQuoteModes,
      quotePricePerWatt: foundQuote.detailedQuote.quotePricePerWatt,
      quotePriceOverride: foundQuote.detailedQuote.quotePriceOverride,
      notes: foundQuote.detailedQuote.notes,
      taxCreditData: taxCreditData
        .filter(
          ({ isFederal, stateCode, applicableQuoteTypes }) =>
            applicableQuoteTypes?.includes(primaryQuoteType) &&
            (isFederal || (stateCode && opportunityState && stateCode === opportunityState)),
        )
        .map(taxCredit => TaxCreditConfigService.snapshot(taxCredit, quoteCostBuildup.projectGrandTotal.netCost ?? 0)),
    };

    detailedQuote.quoteFinanceProduct = this.handleUpdateQuoteFinanceProduct(
      detailedQuote.quoteFinanceProduct as any,
      detailedQuote.quoteCostBuildup,
    ) as any;

    detailedQuote.quoteFinanceProduct.rebateDetails = await this.createRebateDetails(
      rebateProgram,
      fundingSource.rebateAssignment,
      rebateDetails,
    );

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(true);

    model.detailedQuote.quoteFinanceProduct.projectDiscountDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    model.detailedQuote.quoteFinanceProduct.promotionDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    model.detailedQuote.quoteFinanceProduct.incentiveDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildup.projectGrossTotal.netCost),
    );

    const removedUndefined = pickBy(model, item => typeof item !== 'undefined');

    const savedQuote = await this.quoteModel
      .findByIdAndUpdate(
        quoteId,
        {
          '@@check-transform': true,
          ...removedUndefined,
        },
        { new: true },
      )
      .lean();

    return OperationResult.ok(strictPlainToClass(QuoteDto, savedQuote));
  }

  async getAllQuotes(
    limit: number,
    skip: number,
    systemDesignId: string,
    opportunityId: string,
    status: string,
    isSync?: string,
  ): Promise<OperationResult<Pagination<QuoteDto>>> {
    let isArchived;
    switch (status) {
      case STATUS_QUERY.ACTIVE:
        isArchived = { $ne: true };
        break;
      case STATUS_QUERY.ARCHIVED:
        isArchived = true;
        break;
      default:
        isArchived = undefined;
        break;
    }

    const condition = omitBy(
      {
        systemDesignId,
        opportunityId,
        isSync: typeof isSync === 'undefined' ? undefined : getBooleanString(isSync),
        isArchived,
      },
      isNil,
    );

    const [quotes, count] = await Promise.all([
      this.quoteModel.find(condition).limit(limit).skip(skip).lean(),
      this.quoteModel.countDocuments(condition).lean(),
    ]);

    const checkedQuotes = await Promise.all(
      quotes.map(async quote => {
        const isInUsed = await this.checkInUsed(quote._id.toString());
        if (quote.detailedQuote.systemProductionId) {
          const systemProduction = await this.systemProductionService.findById(quote.detailedQuote.systemProductionId);
          if (systemProduction.data && quote) {
            quote.detailedQuote.systemProduction = systemProduction.data;
          }
        }
        return {
          ...quote,
          editable: !isInUsed,
          editableMessage: isInUsed || null,
          isArchived: quote?.isArchived === true,
        };
      }),
    );

    const data = strictPlainToClass(QuoteDto, checkedQuotes);
    const result = {
      data,
      total: count,
    };

    return OperationResult.ok(new Pagination(result));
  }

  async getDetailQuote(quoteId: string): Promise<OperationResult<QuoteDto>> {
    const quote = await this.quoteModel.findById(quoteId).lean();
    const itcRate = await this.iTCModel.findOne().lean();

    if (!quote) {
      throw ApplicationException.EntityNotFound(quoteId);
    }

    const isInUsed = await this.checkInUsed(quoteId);

    if (quote.detailedQuote.systemProductionId) {
      const systemProduction = await this.systemProductionService.findById(quote.detailedQuote.systemProductionId);
      if (systemProduction.data && quote) {
        quote.detailedQuote.systemProduction = systemProduction.data;
      }
    }

    return OperationResult.ok(
      strictPlainToClass(QuoteDto, {
        ...quote,
        itcRate,
        editable: !isInUsed,
        editableMessage: isInUsed || null,
      } as any),
    );
  }

  async updateQuote(quoteId: ObjectId, data: UpdateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const isInUsed = await this.checkInUsed(quoteId.toString());

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    const foundQuote = await this.quoteModel.findById(quoteId).lean();

    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId.toString());
    }

    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('system Design');
    }

    const systemProduction = await this.systemProductionService.findById(systemDesign.systemProductionId);

    if (!systemProduction) {
      throw ApplicationException.EntityNotFound('System Production');
    }

    const { financialProductSnapshot } = foundQuote.detailedQuote.quoteFinanceProduct.financeProduct;
    const { minDownPayment, maxDownPayment, maxDownPaymentPercentage, dealerFee } = financialProductSnapshot;

    const [quoteConfigData, taxCreditData, opportunityRelatedInformation] = await Promise.all([
      this.opportunityService.getPartnerConfigFromOppId(data.opportunityId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(data.opportunityId),
    ]);

    const opportunityState = opportunityRelatedInformation?.data?.state;

    const detailedQuote = {
      ...data,
      systemProductionId: systemDesign.systemProductionId,
      quoteName: data.quoteName || foundQuote.detailedQuote.quoteName,
      isSelected: typeof data.isSelected === 'boolean' ? data.isSelected : foundQuote.detailedQuote.isSelected,
      isSolar: systemDesign.isSolar,
      isRetrofit: systemDesign.isRetrofit,
      primaryQuoteType: foundQuote.detailedQuote.primaryQuoteType,
    };

    detailedQuote.quoteFinanceProduct.projectDiscountDetails = data.quoteFinanceProduct.projectDiscountDetails;

    detailedQuote.quoteFinanceProduct.promotionDetails = data.quoteFinanceProduct.promotionDetails;

    detailedQuote.quoteFinanceProduct.incentiveDetails = data.quoteFinanceProduct.incentiveDetails;

    detailedQuote.quoteFinanceProduct.rebateDetails = data.quoteFinanceProduct.rebateDetails;

    const userInputs: QuoteCostBuildupUserInputDto = {
      salesOriginationSalesFee: data.quoteCostBuildup.salesOriginationSalesFee,
    };

    const dealerFeePercentage = await this.getDealerFeePercentage(
      detailedQuote.quoteFinanceProduct.financeProduct.productType,
      dealerFee,
    );

    const quoteCostBuildUp = this.quoteCostBuildUpService.create({
      roofTopDesignData: systemDesign.roofTopDesignData,
      partnerMarkup: quoteConfigData,
      userInputs,
      dealerFeePercentage,
      discountsPromotionsAndIncentives: {
        discounts: detailedQuote.quoteFinanceProduct.projectDiscountDetails,
        promotions: detailedQuote.quoteFinanceProduct.promotionDetails,
        incentives: detailedQuote.quoteFinanceProduct.incentiveDetails,
      },
    });

    const primaryQuoteType = this.getPrimaryQuoteType(quoteCostBuildUp, systemDesign.existingSystem);

    detailedQuote.primaryQuoteType = primaryQuoteType;

    detailedQuote.quoteCostBuildup = quoteCostBuildUp;
    detailedQuote.quoteFinanceProduct.financeProduct.productAttribute.upfrontPayment = this.calculateUpfrontPayment(
      minDownPayment,
      maxDownPayment,
      maxDownPaymentPercentage,
      quoteCostBuildUp.projectGrandTotal.netCost || 0,
      data.quoteFinanceProduct.financeProduct.productAttribute.upfrontPayment || 0,
    );

    detailedQuote.quoteFinanceProduct.netAmount = quoteCostBuildUp.projectGrandTotal.netCost;

    detailedQuote.taxCreditData = taxCreditData
      .filter(
        ({ isFederal, stateCode, applicableQuoteTypes }) =>
          applicableQuoteTypes?.includes(primaryQuoteType) &&
          (isFederal || (stateCode && opportunityState && stateCode === opportunityState)),
      )
      .map(taxCredit =>
        TaxCreditConfigService.snapshot(taxCredit, detailedQuote.quoteCostBuildup?.projectGrandTotal.netCost ?? 0),
      );

    // const avgMonthlySavings = await this.calculateAvgMonthlySavings(data.opportunityId, systemDesign);
    const avgMonthlySavings = 0; // Commented because we work on battery-only system design for this release.

    switch (detailedQuote.quoteFinanceProduct.financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE:
      case FINANCE_PRODUCT_TYPE.LOAN: {
        const productAttribute = detailedQuote.quoteFinanceProduct.financeProduct
          .productAttribute as LoanProductAttributesDto;

        productAttribute.monthlyUtilityPayment =
          productAttribute.currentMonthlyAverageUtilityPayment - avgMonthlySavings;

        productAttribute.monthlyLoanPayment = this.calculationService.monthlyPaymentAmount(
          quoteCostBuildUp.projectGrandTotal.netCost,
          financialProductSnapshot.interestRate,
          financialProductSnapshot.termMonths,
        );
        break;
      }

      case FINANCE_PRODUCT_TYPE.ESA: {
        const productAttribute = detailedQuote.quoteFinanceProduct.financeProduct
          .productAttribute as EsaProductAttributesDto;
        const { rateEscalator, esaTerm, balance } = productAttribute;
        productAttribute.grossFinancePayment = this.calculationService.calculateGrossFinancePayment(
          rateEscalator,
          esaTerm,
          systemProduction.data?.capacityKW || 0,
          balance,
        );
        break;
      }

      case FINANCE_PRODUCT_TYPE.CASH:
      default: {
        // do nothing
      }
    }

    const model = new QuoteModel(data, detailedQuote);

    model.detailedQuote.quoteFinanceProduct.projectDiscountDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildUp.projectGrossTotal.netCost),
    );

    model.detailedQuote.quoteFinanceProduct.promotionDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildUp.projectGrossTotal.netCost),
    );

    model.detailedQuote.quoteFinanceProduct.incentiveDetails?.map(e =>
      QuoteFinanceProductService.attachImpact(e, quoteCostBuildUp.projectGrossTotal.netCost),
    );

    model.setIsSync(data.isSync);

    const removedUndefined = pickBy(model, item => typeof item !== 'undefined');

    const savedQuote = await this.quoteModel
      .findByIdAndUpdate(
        quoteId,
        {
          '@@check-transform': true,
          ...removedUndefined,
        },
        { new: true },
      )
      .lean();

    return OperationResult.ok(strictPlainToClass(QuoteDto, savedQuote));
  }

  async calculateQuoteDetail(data: CalculateQuoteDetailDto): Promise<OperationResult<QuoteDto>> {
    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);
    const cost = systemDesign?.costPostInstallation || 0;

    const oppData = await this.opportunityService.getOppAccountData(data.opportunityId);
    const manufacturer = await this.manufacturerService.getOneById(
      data.quoteCostBuildup.storageQuoteDetails[0].storageModelDataSnapshot.manufacturerId ?? '',
    );
    // I think this below variable show average money that customer have to pay monthly
    const monthlyUtilityPayment = cost / 12;

    let res: CalculateQuoteDetailDto = {} as any;
    switch (data.quoteFinanceProduct.financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE:
        res = await this.calculationService.calculateLeaseQuote(
          data,
          monthlyUtilityPayment,
          manufacturer.name,
          oppData?.swellESAPricingTier,
        );
        break;
      case FINANCE_PRODUCT_TYPE.LOAN:
        res = await this.calculationService.calculateLoanSolver(data, monthlyUtilityPayment);
        break;
      case FINANCE_PRODUCT_TYPE.ESA:
      case FINANCE_PRODUCT_TYPE.CASH:
        res = {} as any;
        break;
      default:
        break;
    }
    return OperationResult.ok(res as any);
  }

  async getValidationForLease(data: LeaseQuoteValidationDto): Promise<OperationResult<string>> {
    const productAttribute = data.quoteFinanceProduct.financeProduct.productAttribute as LeaseProductAttributesDto;
    const {
      isSolar,
      systemProduction: { capacityKW, productivity },
    } = data;

    const utilityProgramName = data.utilityProgram?.utilityProgramName || 'None';
    const storageSize = sumBy(data.quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizekWh);

    const [oppData, manufacturer] = await Promise.all([
      this.opportunityService.getOppAccountData(data.opportunityId),
      this.manufacturerService.getOneById(
        data.quoteCostBuildup.storageQuoteDetails[0].storageModelDataSnapshot.manufacturerId,
      ),
    ]);

    const storageManufacturer = manufacturer.name;

    // TODO: Tier/StorageManufacturer support
    const query: IGetDetail = {
      isSolar,
      utilityProgramName,
      contractTerm: productAttribute.leaseTerm,
      storageSize,
      storageManufacturer,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      tier: oppData?.swellESAPricingTier!,
      capacityKW,
      productivity,
      rateEscalator: productAttribute.rateEscalator,
    };

    const foundLeaseSolverConfig = await this.leaseSolverConfigService.getDetailByConditions(query);
    if (foundLeaseSolverConfig) {
      return OperationResult.ok('Found One Entity');
    }

    const {
      solarSizeMinimumArr,
      solarSizeMaximumArr,
      productivityMinArr,
      productivityMaxArr,
      storageSizeArr,
      contractTermArr,
    } = await this.leaseSolverConfigService.getMinMaxLeaseSolver(isSolar, utilityProgramName);

    if (capacityKW < solarSizeMinimumArr || capacityKW >= solarSizeMaximumArr) {
      throw ApplicationException.UnprocessableEntity(
        `System capacity should be between ${solarSizeMinimumArr} and ${solarSizeMaximumArr}`,
      );
    }

    if (productivity < productivityMinArr || productivity >= productivityMaxArr) {
      throw ApplicationException.UnprocessableEntity(
        `System productivity should be between ${solarSizeMinimumArr} and ${solarSizeMaximumArr}`,
      );
    }

    if (!storageSizeArr.includes(storageSize)) {
      throw ApplicationException.UnprocessableEntity(
        `Storage size (sizekWh) should be one of the following values: ${storageSizeArr.join(', ')}`,
      );
    }

    if (!contractTermArr.includes(productAttribute.leaseTerm)) {
      throw ApplicationException.UnprocessableEntity(
        `Contract Term should be one of the following values: ${contractTermArr.join(', ')}`,
      );
    }

    throw ApplicationException.UnprocessableEntity(`System Design data does not match any Lease data`);
  }

  public async deleteQuote(quoteId: ObjectId): Promise<void> {
    const found = await this.quoteModel.findOne({ _id: quoteId });

    if (!found) {
      throw new NotFoundException(`No quote found with id ${quoteId.toString()}`);
    }

    const isInUsed = await this.checkInUsed(quoteId.toString());

    if (isInUsed) {
      throw new BadRequestException(isInUsed);
    }

    await found.delete();
  }

  // ->>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<<-\

  async getOneById(id: string): Promise<IDetailedQuoteSchema | undefined> {
    const res = await this.quoteModel.findById(id).lean();
    if (res?.detailedQuote.systemProductionId) {
      const systemProduction = await this.systemProductionService.findById(res?.detailedQuote.systemProductionId);
      if (systemProduction.data) res.detailedQuote.systemProduction = systemProduction.data;
    }
    return res?.detailedQuote;
  }

  async getOneFullQuoteDataById(id: string): Promise<LeanDocument<Quote> | null> {
    const quote = await this.quoteModel.findById(id).lean();
    if (quote?.detailedQuote.systemProductionId) {
      const systemProduction = await this.systemProductionService.findById(quote?.detailedQuote.systemProductionId);
      if (systemProduction.data) quote.detailedQuote.systemProduction = systemProduction.data;
    }
    return quote;
  }

  async setOutdatedData(opportunityId: string, outdatedMessage: string, systemDesignId?: string): Promise<void> {
    const query: Record<string, unknown> = { opportunity_id: opportunityId };

    if (systemDesignId) query.system_design_id = systemDesignId;

    const quotes = await this.quoteModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'v2_contracts',
          let: {
            id: {
              $toString: '$_id',
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$associated_quote_id', '$$id'],
                },
              },
            },
          ],
          as: 'contracts',
        },
      },
      {
        $match: {
          'contracts.0': {
            $exists: false,
          },
        },
      },
      {
        $lookup: {
          from: 'v2_proposals',
          let: {
            id: {
              $toString: '$_id',
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$quote_id', '$$id'],
                },
              },
            },
          ],
          as: 'proposals',
        },
      },
      {
        $match: {
          'proposals.0': {
            $exists: false,
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);

    await this.quoteModel.updateMany(
      { _id: { $in: quotes.map(item => item._id) } },
      {
        $set: {
          is_sync: false,
        },
        $addToSet: {
          is_sync_messages: outdatedMessage,
        },
      },
      {
        multi: true,
      },
    );
  }

  handleUpdateQuoteFinanceProduct(
    quoteFinanceProduct: QuoteFinanceProductDto,
    quoteCostBuildup: IQuoteCostBuildup,
    projectGrossPrice?: number,
  ): QuoteFinanceProductDto {
    const newQuoteFinanceProduct = { ...quoteFinanceProduct };

    newQuoteFinanceProduct.netAmount = projectGrossPrice ?? quoteCostBuildup.projectGrandTotal.netCost;
    newQuoteFinanceProduct.financeProduct.productAttribute = this.handleUpdateProductAttribute(newQuoteFinanceProduct);

    return newQuoteFinanceProduct;
  }

  handleUpdateProductAttribute(quoteFinanceProduct: QuoteFinanceProductDto): any {
    const { financeProduct, netAmount } = quoteFinanceProduct;

    switch (financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.CASH: {
        const newProductAttribute = { ...financeProduct.productAttribute } as any;
        newProductAttribute.balance = netAmount - newProductAttribute.upfrontPayment;
        newProductAttribute.milestonePayment = newProductAttribute.milestonePayment.map((item: any) => ({
          ...item,
          amount: roundNumber(newProductAttribute.balance * item.percentage, 2),
        }));
        return newProductAttribute;
      }

      case FINANCE_PRODUCT_TYPE.ESA: {
        const newProductAttribute = { ...financeProduct.productAttribute } as IEsaProductAttributes;
        newProductAttribute.balance = netAmount - newProductAttribute.upfrontPayment;
        newProductAttribute.milestonePayment = newProductAttribute.milestonePayment.map((item: any) => ({
          ...item,
          amount: roundNumber(newProductAttribute.balance * item.percentage, 2),
        }));
        return newProductAttribute;
      }

      case FINANCE_PRODUCT_TYPE.LOAN: {
        const newProductAttribute = { ...financeProduct.productAttribute } as any;
        newProductAttribute.loanAmount = netAmount - newProductAttribute.upfrontPayment;
        return newProductAttribute;
      }

      case FINANCE_PRODUCT_TYPE.LEASE: {
        const newProductAttribute = { ...financeProduct.productAttribute } as any;
        newProductAttribute.leaseAmount = netAmount;
        return newProductAttribute;
      }

      default: {
        throw new Error(`Wrong FinanceProducts type: ${financeProduct.productType}`);
      }
    }
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.quoteModel.countDocuments({ opportunityId });
    return counter;
  }

  async createRebateDetails(
    rebateProgram: LeanDocument<RebateProgram> | null | IRebateProgramSchema | undefined,
    rebateAssignment: string,
    existingRebateDetails?: IRebateDetailsSchema[],
  ): Promise<IRebateDetailsSchema[]> {
    let isFloatRebate = rebateAssignment === 'customer' ? true : rebateAssignment === 'swell' && false;
    let amount = 0;

    const rebateDetails: IRebateDetailsSchema[] = [];

    if (existingRebateDetails?.length) {
      const foundedRebate = existingRebateDetails.find(item => item.type === rebateProgram?.name);
      isFloatRebate = foundedRebate ? !!foundedRebate?.isFloatRebate : isFloatRebate;
      amount = foundedRebate?.amount || 0;
    }

    if (rebateProgram?.name) {
      rebateDetails.push({
        amount,
        type: <any>rebateProgram?.name,
        description: '',
        isFloatRebate:
          !existingRebateDetails?.length && rebateProgram?.name === REBATE_TYPE.SGIP ? false : isFloatRebate,
      });
    }

    return rebateDetails;
  }

  async checkInUsed(quoteId: string): Promise<false | string> {
    const hasProposals = await this.proposalService.existByQuoteId(quoteId);

    if (hasProposals) return hasProposals('This quote');

    const hasContracts = await this.contractService.existsByQuoteId(quoteId);

    if (hasContracts) return hasContracts('This quote');

    return false;
  }

  public async existBySystemDesignIdAndSubQuery<T = any>(
    systemDesignId: string,
    subQuery: (quoteIdVar: string, quoteName: string) => Record<string, unknown>[],
    toMessage: (obj: T) => string,
  ): Promise<false | { (name: string): string }> {
    const query = [
      {
        $match: {
          system_design_id: systemDesignId,
        },
      },
      {
        $project: {
          _id: {
            $toString: '$_id',
          },
          quoteName: '$detailed_quote.quote_name',
        },
      },
      ...subQuery('$_id', 'quoteName'),
    ];

    const docs = await this.quoteModel.aggregate(query);

    if (docs.length) {
      return name => `${name} ${toMessage(docs[0])}`;
    }

    return false;
  }

  private calculateMaxReinvestmentAmount(
    taxCreditSelectedForReinvestment: boolean,
    taxCreditData: ITaxCreditConfigSnapshot[],
    utilityProgramSelectedForReinvestment: boolean,
    selectedRebateProgram: IRebateDetailsSchema | undefined,
    projectNetAmount: number,
    currentReinvestmentAmount = 0,
  ) {
    const taxCreditAmount =
      (taxCreditSelectedForReinvestment &&
        taxCreditData?.reduce(
          (acc, item) => (acc += roundNumber((item.percentage / 100 || 1) * projectNetAmount, 2)),
          0,
        )) ||
      0;

    const utilityRebateAmount = (utilityProgramSelectedForReinvestment && selectedRebateProgram?.amount) || 0;

    const newReinvestmentAmount = Math.min(currentReinvestmentAmount, taxCreditAmount + utilityRebateAmount);

    return {
      reinvestmentAmount: newReinvestmentAmount,
      reinvestmentMonth: 18,
      description: 'description',
    };
  }

  getPrimaryQuoteType(quoteCostBuildup: IQuoteCostBuildup, existingSystem?: IExistingSystem): PRIMARY_QUOTE_TYPE {
    const { storageQuoteDetails, panelQuoteDetails } = quoteCostBuildup;

    const isSolar = !!panelQuoteDetails?.length;

    const isHasBattery = !!storageQuoteDetails?.length;

    if (isHasBattery && existingSystem) {
      const hasTPOExistingSystem = existingSystem?.financeType === FINANCE_TYPE_EXISTING_SOLAR.TPO;

      if (hasTPOExistingSystem) {
        return PRIMARY_QUOTE_TYPE.BATTERY_WITH_TPO_EXISTING_SOLAR;
      }

      return PRIMARY_QUOTE_TYPE.BATTERY_WITH_EXISTING_SOLAR;
    }

    if (isHasBattery && isSolar) {
      return PRIMARY_QUOTE_TYPE.BATTERY_WITH_NEW_SOLAR;
    }

    if (!isHasBattery && isSolar) {
      return PRIMARY_QUOTE_TYPE.SOLAR_ONLY;
    }

    if (isHasBattery && !isSolar) {
      return PRIMARY_QUOTE_TYPE.BATTERY_ONLY;
    }

    throw new Error('Invalid quote type');
  }

  calculateUpfrontPayment(
    minDownPayment: number,
    maxDownPayment: number,
    maxDownPaymentPercentage: number,
    projectGrandTotal: number,
    currentUpfrontPayment: number,
  ): number {
    let maxDownPaymentValue = maxDownPayment;
    if (maxDownPaymentPercentage) {
      const maxDownPaymentWithPercentage = (maxDownPaymentPercentage / 100) * projectGrandTotal;
      maxDownPaymentValue = Math.min(maxDownPayment, Number(maxDownPaymentWithPercentage.toFixed(2)));
    }

    let newUpfrontPayment = currentUpfrontPayment;
    if (maxDownPaymentValue < newUpfrontPayment) newUpfrontPayment = maxDownPaymentValue;
    if (minDownPayment > newUpfrontPayment) newUpfrontPayment = minDownPayment;

    return newUpfrontPayment;
  }

  async getDealerFeePercentage(type: string, dealerFee: number) {
    switch (type) {
        case FINANCE_PRODUCT_TYPE.CASH:
        case FINANCE_PRODUCT_TYPE.ESA:
        return this.financialProductService.getLowestDealerFee(FINANCE_PRODUCT_TYPE.LOAN);
      case FINANCE_PRODUCT_TYPE.LOAN:
        return dealerFee;
      default:
        return 0;
    }
  }

  getQuotesByCondition(condition, limit: number, skip: number) {
    return this.quoteModel.find(condition).limit(limit).skip(skip).lean();
  }

  updateQuoteById(quoteId: ObjectId, newQuote) {
    return this.quoteModel
      .findByIdAndUpdate(
        quoteId,
        {
          '@@check-transform': true,
          ...newQuote,
        },
        { new: true },
      )
      .lean();
  }

  updateQuotesByCondition(condition, update) {
    return this.quoteModel.updateMany(condition, update);
  }
}
