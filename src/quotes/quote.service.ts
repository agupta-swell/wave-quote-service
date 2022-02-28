/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import { isNil, omit, omitBy, pickBy, sum, sumBy } from 'lodash';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { ContractService } from 'src/contracts/contract.service';
import { DiscountService } from 'src/discounts/discount.service';
import { FinancialProduct } from 'src/financial-products/financial-product.schema';
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
import { SavingsCalculatorService } from 'src/savings-calculator/saving-calculator.service';
import { assignToModel } from 'src/shared/transform/assignToModel';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemDesign } from 'src/system-designs/system-design.schema';
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
import { ITC, I_T_C } from './schemas';
import { CalculationService, QuoteCostBuildUpService, QuoteFinanceProductService } from './sub-services';

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
    private readonly savingCalculatorService: SavingsCalculatorService,
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
  ) {}

  async createQuote(data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const [systemDesign, quoteConfigData, taxCreditData, opportunityRelatedInformation] = await Promise.all([
      this.systemDesignService.getOneById(data.systemDesignId),
      this.quotePartnerConfigService.getDetailByPartnerId(data.partnerId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(data.opportunityId),
    ]);

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('system Design');
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
      throw ApplicationException.EntityNotFound('funding Source');
    }

    const dealerFeePercentage = [FINANCE_PRODUCT_TYPE.CASH, FINANCE_PRODUCT_TYPE.LOAN].includes(
      fundingSource.type as FINANCE_PRODUCT_TYPE,
    )
      ? await this.financialProductService.getHighestDealerFee(FINANCE_PRODUCT_TYPE.LOAN)
      : 0;

    const quoteCostBuildup = this.quoteCostBuildUpService.create({
      roofTopDesignData: systemDesign.roofTopDesignData,
      partnerMarkup: quoteConfigData,
      dealerFeePercentage,
      financialProduct,
      fundingSourceType: fundingSource.type as FINANCE_PRODUCT_TYPE,
    });
    const primaryQuoteType = this.getPrimaryQuoteType(
      quoteCostBuildup,
      !!opportunityRelatedInformation?.data?.existingPV,
    );

    const { minDownPayment, maxDownPayment, maxDownPaymentPercentage } = financialProduct;

    const productAttribute = await this.createProductAttribute(
      fundingSource.type,
      quoteCostBuildup.projectGrandTotal.netCost,
      financialProduct,
    );

    productAttribute.upfrontPayment = this.calculateUpfrontPayment(
      minDownPayment,
      maxDownPayment,
      maxDownPaymentPercentage,
      quoteCostBuildup.projectGrandTotal.netCost || 0,
      productAttribute.upfrontPayment,
    );

    const detailedQuote = {
      systemProduction: systemDesign.systemProductionData,
      quoteCostBuildup,
      rebateProgram,
      utilityProgram: utilityProgram && {
        utilityProgramId: utilityProgram.id,
        utilityProgramName: utilityProgram.utilityProgramName,
        rebateAmount: utilityProgram.rebateAmount,
        utilityProgramDataSnapshot: {
          id: utilityProgram.id,
          name: utilityProgram.utilityProgramName,
          rebateAmount: utilityProgram.rebateAmount,
        },
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
        netAmount: 0,
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
      quotePricePerWatt: data.quotePricePerWatt || { pricePerWatt: -1, grossPrice: -1 },
      quotePriceOverride: data.quotePriceOverride,
      notes: [],
    };

    if (quoteConfigData) {
      if (quoteConfigData.enableCostBuildup) {
        detailedQuote.allowedQuoteModes.push(QUOTE_MODE_TYPE.COST_BUILD_UP);
      }

      if (quoteConfigData.enablePricePerWatt) {
        detailedQuote.allowedQuoteModes.push(QUOTE_MODE_TYPE.PRICE_PER_WATT);
        detailedQuote.quotePricePerWatt.pricePerWatt = 0;
      }

      if (quoteConfigData.enablePriceOverride) {
        detailedQuote.allowedQuoteModes.push(QUOTE_MODE_TYPE.PRICE_OVERRIDE);
      }

      detailedQuote.selectedQuoteMode =
        detailedQuote.allowedQuoteModes.length === 1 ? detailedQuote.allowedQuoteModes[0] : '';
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

    let gsPrograms;
    if (
      foundQuote.detailedQuote.quoteCostBuildup.storageQuoteDetails.length &&
      foundSystemDesign.roofTopDesignData.storage.length
    ) {
      gsPrograms = await this.gsProgramsService.getList(
        100,
        0,
        foundQuote.detailedQuote.utilityProgram.utilityProgramId,
        systemDesignId,
      );
    }

    const [markupConfig, taxCreditData, opportunityRelatedInformation] = await Promise.all([
      this.opportunityService.getPartnerConfigFromOppId(foundQuote.opportunityId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(foundQuote.opportunityId),
    ]);

    const newDoc = omit(foundQuote, ['_id', 'createdAt', 'updatedAt']);

    const validDiscounts = newDoc.detailedQuote.quoteFinanceProduct.projectDiscountDetails.filter(
      DiscountService.validate,
    );

    const validPromotions = newDoc.detailedQuote.quoteFinanceProduct.promotionDetails.filter(PromotionService.validate);

    newDoc.detailedQuote.quoteFinanceProduct.projectDiscountDetails = validDiscounts;

    newDoc.detailedQuote.quoteFinanceProduct.promotionDetails = validPromotions;

    if (foundQuote.systemDesignId !== systemDesignId) {
      const gsProgram = gsPrograms?.data?.data?.find(
        gsProgram =>
          gsProgram.id === newDoc.detailedQuote.quoteFinanceProduct.incentiveDetails[0].detail.gsProgramSnapshot.id,
      );
      if (!gsProgram) {
        newDoc.detailedQuote.quoteCostBuildup.totalPromotionsDiscountsAndSwellGridrewards = {
          cogsAmount: 0,
          marginAmount: 0,
          total: 0,
        };
        newDoc.detailedQuote.quoteFinanceProduct.incentiveDetails = [];
      }
    }

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
    model.detailedQuote.systemProduction = foundSystemDesign.systemProductionData;

    const { selectedQuoteMode, quotePricePerWatt, quotePriceOverride } = foundQuote.detailedQuote;

    model.detailedQuote.selectedQuoteMode = selectedQuoteMode;

    if (quotePricePerWatt) {
      model.detailedQuote.quotePricePerWatt = {
        pricePerWatt: foundQuote.detailedQuote.quotePricePerWatt.pricePerWatt,
        grossPrice:
          foundQuote.detailedQuote.quotePricePerWatt.pricePerWatt *
          foundSystemDesign.systemProductionData.capacityKW *
          1000,
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
      throw ApplicationException.EntityNotFound('funding Source');
    }

    const dealerFeePercentage = [FINANCE_PRODUCT_TYPE.CASH, FINANCE_PRODUCT_TYPE.LOAN].includes(
      fundingSource.type as FINANCE_PRODUCT_TYPE,
    )
      ? await this.financialProductService.getHighestDealerFee(FINANCE_PRODUCT_TYPE.LOAN)
      : 0;

    const quoteCostBuildup = this.quoteCostBuildUpService.create({
      roofTopDesignData: foundSystemDesign.roofTopDesignData,
      partnerMarkup: markupConfig,
      userInputs: foundQuote.detailedQuote.quoteCostBuildup,
      dealerFeePercentage,
      financialProduct: financialProductSnapshot,
      fundingSourceType: fundingSource.type as FINANCE_PRODUCT_TYPE,
      discountsPromotionsAndIncentives: {
        discounts: foundQuote.detailedQuote.quoteFinanceProduct.projectDiscountDetails,
        promotions: foundQuote.detailedQuote.quoteFinanceProduct.promotionDetails,
        incentives: foundQuote.detailedQuote.quoteFinanceProduct.incentiveDetails,
      },
    });

    model.detailedQuote.quoteCostBuildup = quoteCostBuildup;

    const primaryQuoteType = this.getPrimaryQuoteType(
      quoteCostBuildup,
      !!opportunityRelatedInformation?.data?.existingPV,
    );

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

    let productAttribute = await this.createProductAttribute(
      financeProduct.productType,
      currentProjectPrice,
      financialProductSnapshot,
    );

    const { productAttribute: product_attribute } = financeProduct as any;

    const avgMonthlySavings = await this.calculateAvgMonthlySavings(foundSystemDesign.opportunityId, foundSystemDesign);

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

      default: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
          newAverageMonthlyBill: productAttribute.currentAverageMonthlyBill - avgMonthlySavings,
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

  async createProductAttribute(
    productType: string,
    netAmount: number,
    financeProductSnapshot: LeanDocument<FinancialProduct>,
  ): Promise<any> {
    // TODO: Refactor this function with correct params and default value.
    let template: ILoanProductAttributes | ILeaseProductAttributes | ICashProductAttributes;

    const { defaultDownPayment, interestRate, termMonths } = financeProductSnapshot;

    switch (productType) {
      case FINANCE_PRODUCT_TYPE.LOAN:
        template = {
          upfrontPayment: defaultDownPayment,
          loanAmount: netAmount,
          loanStartDate: new Date(new Date().setDate(1)),
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
          currentPricePerKWh: 0,
          newPricePerKWh: 0,
          yearlyLoanPaymentDetails: [],
          reinvestment: [],
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
          currentPricePerKWh: 0,
          newPricePerKWh: 0,
          yearlyLeasePaymentDetails: [],
          ratePerKWh: 0,
        } as ILeaseProductAttributes;
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
          cashQuoteConfigSnapShotDate: '',
          currentAverageMonthlyBill: 0,
          newAverageMonthlyBill: 0,
          currentPricePerKWh: 0,
          newPricePerKWh: 0,
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
    ] = await Promise.all([
      this.quoteModel.findById(quoteId).lean(),
      this.systemDesignService.getOneById(data.systemDesignId),
      this.quotePartnerConfigService.getDetailByPartnerId(data.partnerId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(data.opportunityId),
    ]);

    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId);
    }

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('system Design');
    }

    if (!quotePartnerConfig) {
      throw new NotFoundException('No quote partner config');
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
    const { minDownPayment, maxDownPayment, maxDownPaymentPercentage } = financialProductSnapshot;

    const fundingSource = await this.fundingSourceService.getDetailById(financeProduct.fundingSourceId);
    if (!fundingSource) {
      throw ApplicationException.EntityNotFound('funding Source');
    }

    const dealerFeePercentage = [FINANCE_PRODUCT_TYPE.CASH, FINANCE_PRODUCT_TYPE.LOAN].includes(
      fundingSource.type as FINANCE_PRODUCT_TYPE,
    )
      ? await this.financialProductService.getHighestDealerFee(FINANCE_PRODUCT_TYPE.LOAN)
      : 0;

    const quoteCostBuildup = this.quoteCostBuildUpService.create({
      roofTopDesignData: systemDesign.roofTopDesignData,
      partnerMarkup: quotePartnerConfig,
      dealerFeePercentage,
      financialProduct: financialProductSnapshot,
      fundingSourceType: fundingSource.type as FINANCE_PRODUCT_TYPE,
    });
    const primaryQuoteType = this.getPrimaryQuoteType(
      quoteCostBuildup,
      !!opportunityRelatedInformation?.data?.existingPV,
    );

    const avgMonthlySavings = await this.calculateAvgMonthlySavings(data.opportunityId, systemDesign);

    let productAttribute = await this.createProductAttribute(
      financeProduct.productType,
      quoteCostBuildup.projectGrandTotal.netCost,
      financialProductSnapshot,
    );
    const { productAttribute: product_attribute } = financeProduct as any;
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

      default: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
          newAverageMonthlyBill: productAttribute.currentAverageMonthlyBill - avgMonthlySavings,
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
      systemProduction: systemDesign.systemProductionData,
      quoteCostBuildup,
      rebateProgramDetail: rebateProgram,
      utilityProgram,
      quoteFinanceProduct: {
        financeProduct: {
          productType: financeProduct.productType,
          fundingSourceId: financeProduct.fundingSourceId,
          fundingSourceName: financeProduct.fundingSourceName,
          productAttribute,
          financialProductSnapshot: financeProduct.financialProductSnapshot,
        },
        netAmount: quoteCostBuildup.projectGrossTotal.netCost,
        incentiveDetails: handledIncentiveDetails,
        rebateDetails,
        projectDiscountDetails:
          data.quoteFinanceProduct?.projectDiscountDetails ?? projectDiscountDetails.filter(DiscountService.validate),
        promotionDetails:
          data.quoteFinanceProduct?.promotionDetails ?? promotionDetails.filter(PromotionService.validate),
      },
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

    return OperationResult.ok(strictPlainToClass(QuoteDto, { ...model, _id: foundQuote._id } as any));
  }

  async getAllQuotes(
    limit: number,
    skip: number,
    systemDesignId: string,
    opportunityId: string,
    isSync: string,
  ): Promise<OperationResult<Pagination<QuoteDto>>> {
    const condition = omitBy(
      {
        systemDesignId,
        opportunityId,
        isSync: typeof isSync === 'undefined' ? undefined : getBooleanString(isSync),
      },
      isNil,
    );

    const [quotes, count] = await Promise.all([
      this.quoteModel.find(condition).limit(limit).skip(skip).lean(),
      this.quoteModel.countDocuments(condition).lean(),
    ]);

    const checkedQuotes = await Promise.all(
      quotes.map(async q => {
        const isInUsed = await this.checkInUsed(q._id.toString());
        return { ...q, editable: !isInUsed, editableMessage: isInUsed || null };
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

    const { financialProductSnapshot } = foundQuote.detailedQuote.quoteFinanceProduct.financeProduct;
    const { minDownPayment, maxDownPayment, maxDownPaymentPercentage } = financialProductSnapshot;

    const [quoteConfigData, taxCreditData, opportunityRelatedInformation] = await Promise.all([
      this.opportunityService.getPartnerConfigFromOppId(data.opportunityId),
      this.taxCreditConfigService.getActiveTaxCreditConfigs(),
      this.opportunityService.getRelatedInformation(data.opportunityId),
    ]);

    const opportunityState = opportunityRelatedInformation?.data?.state;

    const detailedQuote = {
      ...data,
      systemProduction: systemDesign.systemProductionData,
      quoteName: data.quoteName || foundQuote.detailedQuote.quoteName,
      isSelected: typeof data.isSelected === 'boolean' ? data.isSelected : foundQuote.detailedQuote.isSelected,
      isSolar: systemDesign.isSolar,
      isRetrofit: systemDesign.isRetrofit,
    };

    detailedQuote.quoteFinanceProduct.projectDiscountDetails = data.quoteFinanceProduct.projectDiscountDetails;

    detailedQuote.quoteFinanceProduct.promotionDetails = data.quoteFinanceProduct.promotionDetails;

    detailedQuote.quoteFinanceProduct.incentiveDetails = data.quoteFinanceProduct.incentiveDetails;

    detailedQuote.quoteFinanceProduct.rebateDetails = data.quoteFinanceProduct.rebateDetails;

    const userInputs: QuoteCostBuildupUserInputDto = {
      salesOriginationSalesFee: data.quoteCostBuildup.salesOriginationSalesFee,
    };

    const dealerFeePercentage = [FINANCE_PRODUCT_TYPE.CASH, FINANCE_PRODUCT_TYPE.LOAN].includes(
      detailedQuote.quoteFinanceProduct.financeProduct.productType,
    )
      ? await this.financialProductService.getHighestDealerFee(FINANCE_PRODUCT_TYPE.LOAN)
      : 0;

    const quoteCostBuildUp = this.quoteCostBuildUpService.create({
      roofTopDesignData: systemDesign.roofTopDesignData,
      partnerMarkup: quoteConfigData,
      userInputs,
      dealerFeePercentage,
      financialProduct: detailedQuote.quoteFinanceProduct.financeProduct.financialProductSnapshot,
      fundingSourceType: detailedQuote.quoteFinanceProduct.financeProduct.productType,
      discountsPromotionsAndIncentives: {
        discounts: detailedQuote.quoteFinanceProduct.projectDiscountDetails,
        promotions: detailedQuote.quoteFinanceProduct.promotionDetails,
        incentives: detailedQuote.quoteFinanceProduct.incentiveDetails,
      },
    });
    const primaryQuoteType = this.getPrimaryQuoteType(
      quoteCostBuildUp,
      !!opportunityRelatedInformation?.data?.existingPV,
    );

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

      default: {
        (detailedQuote.quoteFinanceProduct.financeProduct
          .productAttribute as CashProductAttributesDto).newAverageMonthlyBill =
          (detailedQuote.quoteFinanceProduct.financeProduct.productAttribute as CashProductAttributesDto)
            .currentAverageMonthlyBill - avgMonthlySavings;
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
    const cost = systemDesign?.costPostInstallation?.cost || [];

    const oppData = await this.opportunityService.getOppAccountData(data.opportunityId);
    const manufacturer = await this.manufacturerService.getOneById(
      data.quoteCostBuildup.storageQuoteDetails[0].storageModelDataSnapshot.manufacturerId ?? '',
    );
    // I think this below variable show average money that customer have to pay monthly
    const monthlyUtilityPayment = cost.reduce((acc, item) => (acc += item.v), 0) / cost.length;

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
    return res?.detailedQuote;
  }

  async getOneFullQuoteDataById(id: string): Promise<LeanDocument<Quote> | null> {
    const quote = await this.quoteModel.findById(id).lean();
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
    const grossPrice = projectGrossPrice ?? quoteCostBuildup.projectGrossTotal.netCost;

    const newQuoteFinanceProduct = { ...quoteFinanceProduct };

    newQuoteFinanceProduct.netAmount = new BigNumber(grossPrice)
      .minus(quoteCostBuildup.totalPromotionsDiscountsAndSwellGridrewards.total)
      .toNumber();
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

  private async calculateAvgMonthlySavings(
    opportunityId: string,
    systemDesign: SystemDesign | LeanDocument<SystemDesign>,
  ): Promise<number> {
    const utilityUsage = await this.utilityService.getUtilityUsageDetail(opportunityId);

    const productionByHour = await this.systemDesignService.calculateSystemProductionByHour(systemDesign as any);

    const oppData = await this.opportunityService.getRelatedInformation(opportunityId);

    const savings = await this.savingCalculatorService.getSavings({
      historicalUsageByHour: utilityUsage.data?.utilityData.actualUsage.hourlyUsage.map(e => e.v),
      historicalBillsByMonth: utilityUsage.data?.costData.actualUsageCost?.cost.map(e => e.v),
      historicalProductionByHour: productionByHour.hourly, //
      existingBatteryKwh: undefined, // TODO
      additionalBatteryKwh: undefined, // TODO
      preInstallTariff: utilityUsage.data?.costData.masterTariffId,
      postInstallTariff: utilityUsage.data?.costData.postInstallMasterTariffId,
      batteryReservePercentage: undefined, // TODO,
      usageProfile: undefined, // TODO
      version: 0, // TODO add env to lambda,
      address: {
        city: oppData.data?.city,
        latitude: +(oppData.data?.latitude || 0),
        longitude: +(oppData.data?.longitude || 0),
        line1: oppData.data?.address,
        state: oppData.data?.state,
        zip: oppData.data?.zipCode,
      },
    });

    return sum(savings.expectedBillSavingsByMonth) / savings.expectedBillSavingsByMonth.length;
  }

  getPrimaryQuoteType(quoteCostBuildup: IQuoteCostBuildup, existingPV: boolean): PRIMARY_QUOTE_TYPE {
    const { storageQuoteDetails, panelQuoteDetails } = quoteCostBuildup;

    const isSolar = !!panelQuoteDetails?.length;

    const isHasBattery = !!storageQuoteDetails?.length;

    if (!isHasBattery && isSolar) {
      return PRIMARY_QUOTE_TYPE.SOLAR_ONLY;
    }

    if (isHasBattery && !existingPV && !isSolar) {
      return PRIMARY_QUOTE_TYPE.BATTERY_ONLY;
    }

    if (isHasBattery && existingPV && !isSolar) {
      return PRIMARY_QUOTE_TYPE.BATTERY_WITH_EXISTING_SOLAR;
    }

    return PRIMARY_QUOTE_TYPE.BATTERY_WITH_NEW_SOLAR;
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
}
