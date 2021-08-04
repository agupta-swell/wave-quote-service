/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { differenceBy, groupBy, isNil, max, min, omit, omitBy, pickBy, sumBy, uniq } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { FinancialProductDto } from 'src/financial-products/res/financial-product.dto';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { IGetDetail } from 'src/lease-solver-configs/typing';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { COMPONENT_TYPE, COST_UNIT_TYPE, PRODUCT_CATEGORY_TYPE } from 'src/system-designs/constants';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { getBooleanString } from 'src/utils/common';
import { roundNumber } from 'src/utils/transformNumber';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { RebateProgramService } from 'src/rebate-programs/rebate-programs.service';
import { ProposalService } from 'src/proposals/proposal.service';
import { ContractService } from 'src/contracts/contract.service';
import { OperationResult, Pagination } from '../app/common';
import { CashPaymentConfigService } from '../cash-payment-configs/cash-payment-config.service';
import { LeaseSolverConfigService } from '../lease-solver-configs/lease-solver-config.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import {
  ELaborCostType,
  FINANCE_PRODUCT_TYPE,
  PROJECT_DISCOUNT_UNITS,
  QUOTE_MODE_TYPE,
  REBATE_TYPE,
} from './constants';
import { IDetailedQuoteSchema, IRebateDetailsSchema, Quote, QUOTE, QuoteModel } from './quote.schema';
import {
  CalculateQuoteDetailDto,
  CashProductAttributesDto,
  CreateQuoteDto,
  LaborCostDetails,
  LeaseProductAttributesDto,
  LeaseQuoteValidationDto,
  LoanProductAttributesDto,
  QuoteCostBuildupDto,
  QuoteFinanceProductDto,
  UpdateQuoteDto,
} from './req';
import { DiscountsDto, QuoteDto, TaxCreditDto } from './res';
import {
  DISCOUNTS,
  ITC,
  I_T_C,
  QuoteMarkupConfig,
  QUOTE_MARKUP_CONFIG,
  TaxCreditConfig,
  TAX_CREDIT_CONFIG,
} from './schemas';
import { Discounts } from './schemas/discounts.schema';
import { CalculationService } from './sub-services/calculation.service';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(QUOTE) private readonly quoteModel: Model<Quote>,
    @InjectModel(DISCOUNTS) private readonly discountsModel: Model<Discounts>,
    @InjectModel(TAX_CREDIT_CONFIG) private readonly taxCreditConfigModel: Model<TaxCreditConfig>,
    @InjectModel(QUOTE_MARKUP_CONFIG) private readonly quoteMarkupConfigModel: Model<QuoteMarkupConfig>,
    @InjectModel(I_T_C) private readonly iTCModel: Model<ITC>,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly utilityProgramService: UtilityProgramMasterService,
    private readonly fundingSourceService: FundingSourceService,
    @Inject(forwardRef(() => FinancialProductsService))
    private readonly financialProductService: FinancialProductsService,
    private readonly cashPaymentConfigService: CashPaymentConfigService,
    private readonly calculationService: CalculationService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
    private readonly quotePartnerConfigService: QuotePartnerConfigService,
    private readonly rebateProgramService: RebateProgramService,
    @Inject(forwardRef(() => ProposalService))
    private readonly proposalService: ProposalService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  async createQuote(data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const [systemDesign, markupConfigs, quoteConfigData] = await Promise.all([
      this.systemDesignService.getOneById(data.systemDesignId),
      this.quoteMarkupConfigModel.find({ partnerId: data.partnerId }).lean(),
      this.quotePartnerConfigService.getDetailByPartnerId(data.partnerId),
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

    if (!markupConfigs.length) {
      throw ApplicationException.EntityNotFound('Quote Config');
    }

    const quoteCostBuildup = {
      panelQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.panelArray.map(item => {
          const cost = item.numberOfPanels * item.panelModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.SOLAR,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            panelModelId: item.panelModelId,
            panelModelDataSnapshot: item.panelModelDataSnapshot,
            panelModelSnapshotDate: new Date(),
            quantity: item.numberOfPanels,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'panelModelId',
      ),
      inverterQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.inverters.map(item => {
          const cost = item.quantity * item.inverterModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.INVERTER,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            inverterModelId: item.inverterModelId,
            inverterModelDataSnapshot: item.inverterModelDataSnapshot,
            inverterModelSnapshotDate: new Date(),
            cost,
            subcontractorMarkup,
            netCost,
            quantity: item.quantity,
          };
        }),
        'inverterModelId',
      ),
      storageQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.storage.map(item => {
          const cost = item.quantity * item.storageModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.STORAGE,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            storageModelId: item.storageModelId,
            storageModelDataSnapshot: item.storageModelDataSnapshot,
            storageModelSnapshotDate: new Date(),
            cost,
            subcontractorMarkup,
            netCost,
            quantity: item.quantity,
          };
        }),
        'storageModelId',
      ),
      adderQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.adders.map(item => {
          const cost = item.quantity * item.adderModelDataSnapshot.price;
          const subcontractorMarkup = 0;
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            adderModelId: item.adderId,
            adderModelDataSnapshot: item.adderModelDataSnapshot,
            adderModelSnapshotDate: new Date(),
            quantity: item.quantity,
            unit: item.unit,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'adderModelId',
      ),
      balanceOfSystemDetails: this.groupData(
        systemDesign.roofTopDesignData.balanceOfSystems?.map(item => {
          const cost = item.balanceOfSystemModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.balanceOfSystemModelDataSnapshot.relatedComponent,
            PRODUCT_CATEGORY_TYPE.BOS,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            balanceOfSystemModelId: item.balanceOfSystemId,
            balanceOfSystemModelDataSnapshot: item.balanceOfSystemModelDataSnapshot,
            balanceOfSystemModelDataSnapshotDate: new Date(),
            unit: item.unit,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'balanceOfSystemModelId',
      ),
      ancillaryEquipmentDetails: this.groupData(
        systemDesign.roofTopDesignData.ancillaryEquipments?.map(item => {
          const cost = item.quantity * item.ancillaryEquipmentModelDataSnapshot.averageWholeSalePrice;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.ancillaryEquipmentModelDataSnapshot.relatedComponent,
            PRODUCT_CATEGORY_TYPE.ANCILLARY,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            ancillaryEquipmentId: item.ancillaryId,
            ancillaryEquipmentModelDataSnapshot: item.ancillaryEquipmentModelDataSnapshot,
            ancillaryEquipmentSnapshotDate: new Date(),
            quantity: item.quantity,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'ancillaryEquipmentId',
      ),
      swellStandardMarkup: quoteConfigData.swellStandardMarkup || 0,
      laborCost: {
        laborCostDataSnapshot: {
          id: quoteConfigData._id.toString() || '',
          solarOnlyLaborFeePerWatt: quoteConfigData.solarOnlyLaborFeePerWatt || 0,
          storageRetrofitLaborFeePerProject: quoteConfigData.storageRetrofitLaborFeePerProject || 0,
          solarWithACStorageLaborFeePerProject: quoteConfigData.solarWithACStorageLaborFeePerProject || 0,
          solarWithDCStorageLaborFeePerProject: quoteConfigData.solarWithDCStorageLaborFeePerProject || 0,
        },
        laborCostSnapshotDate: new Date(),
        laborCostType: '',
        cost: 0,
      },
      grossPrice: 0,
      totalNetCost: 0,
    };

    const laborCostData = this.calculateLaborCost(
      systemDesign,
      quoteCostBuildup.laborCost.laborCostDataSnapshot as any,
    );
    quoteCostBuildup.laborCost.laborCostType = laborCostData.laborCostType;
    quoteCostBuildup.laborCost.cost = laborCostData.cost;

    const grossPriceData = this.calculateGrossPrice(quoteCostBuildup);
    quoteCostBuildup.grossPrice = grossPriceData.grossPrice;
    quoteCostBuildup.totalNetCost = grossPriceData.totalNetCost;

    const utilityProgram = data.utilityProgramId
      ? await this.utilityProgramService.getDetailById(data.utilityProgramId)
      : null;

    const financialProduct = await this.financialProductService.getDetailByFinancialProductId(data.financialProductId);
    if (!financialProduct) {
      throw ApplicationException.EntityNotFound('financial Source');
    }

    const fundingSource = await this.fundingSourceService.getDetailById(data.fundingSourceId);
    if (!fundingSource) {
      throw ApplicationException.EntityNotFound('funding Source');
    }

    const detailedQuote = {
      systemProduction: systemDesign.systemProductionData,
      quoteCostBuildup,
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
          productAttribute: await this.createProductAttribute(
            fundingSource.type,
            quoteCostBuildup.grossPrice,
            financialProduct?.defaultDownPayment || 0,
          ),
          financialProductSnapshot: strictPlainToClass(FinancialProductDto, financialProduct),
        },
        netAmount: 0,
        incentiveDetails: [
          {
            amount: 0,
            type: REBATE_TYPE.SGIP,
            detail: {
              gsTermYears: '0',
              gsProgramSnapshot: {
                id: '',
                annualIncentives: 0,
                numberBatteries: '0',
                termYears: '0',
                upfrontIncentives: 0,
                utilityProgram: {
                  id: '',
                  utilityProgramName: '',
                },
              },
            },
          },
        ],
        rebateDetails: await this.createRebateDetails(
          data.opportunityId,
          grossPriceData.grossPrice ?? 0,
          fundingSource.rebateAssignment,
        ),
        projectDiscountDetails: [],
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

      detailedQuote.selectedQuoteMode = '';
    }

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(true);

    const obj = new this.quoteModel(model);

    await obj.save();

    return OperationResult.ok(strictPlainToClass(QuoteDto, obj.toJSON()));
  }

  async cloneQuote(quoteId: ObjectId): Promise<OperationResult<QuoteDto>> {
    const foundQuote = await this.quoteModel.findById(quoteId).lean();
    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId.toString());
    }

    const originQuoteName = foundQuote.detailedQuote.quoteName.replace(/\s\([0-9]*(\)$)/, '');
    const totalSameNameQuotes = await this.quoteModel
      .find({
        opportunity_id: foundQuote.opportunityId,
        system_design_id: foundQuote.systemDesignId,
        'detailed_quote.quote_name': { $regex: originQuoteName },
      })
      .count();

    const obj = new this.quoteModel({
      ...omit(foundQuote, ['_id', 'createdAt', 'updatedAt']),
      detailedQuote: {
        ...foundQuote.detailedQuote,
        quoteName: `${originQuoteName} (${totalSameNameQuotes + 1})`,
      },
      isSync: true,
      isSyncMessages: [],
    });
    await obj.save();

    return OperationResult.ok(strictPlainToClass(QuoteDto, obj.toJSON()));
  }

  async createProductAttribute(productType: string, netAmount: number, defaultDownPayment: number): Promise<any> {
    let template = {};
    switch (productType) {
      case FINANCE_PRODUCT_TYPE.LOAN:
        template = {
          upfrontPayment: defaultDownPayment,
          loanAmount: netAmount,
          loanStartDate: new Date(new Date().setDate(1)),
          interestRate: 6.5,
          loanTerm: 240,
          taxCreditPrepaymentAmount: 0,
          willingToPayThroughAch: false,
          monthlyLoanPayment: 0,
          currentMonthlyAverageUtilityPayment: 0,
          monthlyUtilityPayment: 0,
          gridServicePayment: 0,
          netCustomerEnergySpend: 0,
          returnOnInvestment: 0,
          payBackPeriod: 0,
          currentPricePerKwh: 0,
          newPricePerKwh: 0,
          yearlyLoanPaymentDetails: [],
        };
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
          currentPricePerKwh: 0,
          newPricePerKwh: 0,
          yearlyLeasePaymentDetails: [],
        };
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
          currentPricePerKwh: 0,
          newPricePerKwh: 0,
        };
        return template;
      }
    }
  }

  async updateLatestQuote(data: CreateQuoteDto, quoteId: string): Promise<OperationResult<QuoteDto>> {
    const isInUsed = await this.checkInUsed(quoteId);

    if (isInUsed) {
      throw new BadRequestException('This quote has been used in either proposal or contract');
    }

    const [foundQuote, systemDesign, markupConfigs] = await Promise.all([
      this.quoteModel.findById(quoteId).lean(),
      this.systemDesignService.getOneById(data.systemDesignId),
      this.quoteMarkupConfigModel.find({ partnerId: data.partnerId }).lean(),
    ]);

    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId);
    }

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('system Design');
    }

    if (!markupConfigs.length) {
      throw ApplicationException.EntityNotFound('Quote Config');
    }

    const {
      quoteFinanceProduct: {
        incentiveDetails,
        projectDiscountDetails,
        rebateDetails,
        financeProduct,
        financialProductSnapshot,
      },
    } = foundQuote.detailedQuote;

    const quoteCostBuildup = {
      panelQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.panelArray.map(item => {
          const cost = item.numberOfPanels * item.panelModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.SOLAR,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            panelModelId: item.panelModelId,
            panelModelDataSnapshot: item.panelModelDataSnapshot,
            panelModelSnapshotDate: new Date(),
            quantity: item.numberOfPanels,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'panelModelId',
      ),
      inverterQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.inverters.map(item => {
          const cost = item.quantity * item.inverterModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.INVERTER,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            inverterModelId: item.inverterModelId,
            inverterModelDataSnapshot: item.inverterModelDataSnapshot,
            inverterModelSnapshotDate: new Date(),
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'inverterModelId',
      ),
      storageQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.storage.map(item => {
          const cost = item.quantity * item.storageModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.STORAGE,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            storageModelId: item.storageModelId,
            storageModelDataSnapshot: item.storageModelDataSnapshot,
            storageModelSnapshotDate: new Date(),
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'storageModelId',
      ),
      adderQuoteDetails: this.groupData(
        systemDesign.roofTopDesignData.adders.map(item => {
          const cost = item.quantity * item.adderModelDataSnapshot.price;
          const subcontractorMarkup = 0;
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            adderModelId: item.adderId,
            adderModelDataSnapshot: item.adderModelDataSnapshot,
            adderModelSnapshotDate: new Date(),
            quantity: item.quantity,
            unit: item.unit,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'adderModelId',
      ),
      balanceOfSystemDetails: this.groupData(
        systemDesign.roofTopDesignData.balanceOfSystems?.map(item => {
          const cost = item.balanceOfSystemModelDataSnapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.balanceOfSystemModelDataSnapshot.relatedComponent,
            PRODUCT_CATEGORY_TYPE.BOS,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            balanceOfSystemModelId: item.balanceOfSystemId,
            balanceOfSystemModelDataSnapshot: item.balanceOfSystemModelDataSnapshot,
            balanceOfSystemModelDataSnapshotDate: new Date(),
            unit: item.unit,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'balanceOfSystemModelId',
      ),
      ancillaryEquipmentDetails: this.groupData(
        systemDesign.roofTopDesignData.ancillaryEquipments.map(item => {
          const cost = item.quantity * item.ancillaryEquipmentModelDataSnapshot.averageWholeSalePrice;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.ancillaryEquipmentModelDataSnapshot.relatedComponent,
            PRODUCT_CATEGORY_TYPE.ANCILLARY,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            ancillaryEquipmentId: item.ancillaryId,
            ancillaryEquipmentModelDataSnapshot: item.ancillaryEquipmentModelDataSnapshot,
            ancillaryEquipmentSnapshotDate: new Date(),
            quantity: item.quantity,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'ancillaryEquipmentId',
      ),
      swellStandardMarkup: foundQuote.detailedQuote.quoteCostBuildup.swellStandardMarkup || 0,
      laborCost: {
        laborCostDataSnapshot: {
          id: foundQuote.detailedQuote.quoteCostBuildup.laborCost.laborCostDataSnapshot.id,
          solarOnlyLaborFeePerWatt:
            foundQuote.detailedQuote.quoteCostBuildup.laborCost.laborCostDataSnapshot.solarOnlyLaborFeePerWatt,
          storageRetrofitLaborFeePerProject:
            foundQuote.detailedQuote.quoteCostBuildup.laborCost.laborCostDataSnapshot.storageRetrofitLaborFeePerProject,
          solarWithACStorageLaborFeePerProject:
            foundQuote.detailedQuote.quoteCostBuildup.laborCost.laborCostDataSnapshot
              .solarWithACStorageLaborFeePerProject,
          solarWithDCStorageLaborFeePerProject:
            foundQuote.detailedQuote.quoteCostBuildup.laborCost.laborCostDataSnapshot
              .solarWithDCStorageLaborFeePerProject,
        },
        laborCostSnapshotDate: new Date(),
        laborCostType: '',
        cost: 0,
      },
      grossPrice: 0,
      totalNetCost: 0,
    };

    const laborCostData = this.calculateLaborCost(
      systemDesign,
      quoteCostBuildup.laborCost.laborCostDataSnapshot as any,
    );
    quoteCostBuildup.laborCost.laborCostType = laborCostData.laborCostType;
    quoteCostBuildup.laborCost.cost = laborCostData.cost;

    const grossPriceData = this.calculateGrossPrice(quoteCostBuildup);
    quoteCostBuildup.grossPrice = grossPriceData.grossPrice;
    quoteCostBuildup.totalNetCost = grossPriceData.totalNetCost;
    let productAttribute = await this.createProductAttribute(
      financeProduct.productType,
      quoteCostBuildup.grossPrice,
      financialProductSnapshot?.defaultDownPayment || 0,
    );
    const { productAttribute: product_attribute } = financeProduct as any;
    switch (financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE: {
        productAttribute = {
          ...productAttribute,
          rateEscalator: product_attribute.rateEscalator,
          leaseTerm: product_attribute.leaseTerm,
        } as LeaseProductAttributesDto;
        break;
      }
      case FINANCE_PRODUCT_TYPE.LOAN: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfrontPayment,
          interestRate: product_attribute.interestRate,
          loanTerm: product_attribute.loanTerm,
        } as LoanProductAttributesDto;
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

    const utilityProgramDetail =
      data.utilityProgramId && data.utilityProgramId !== 'None'
        ? await this.utilityProgramService.getDetailById(data.utilityProgramId)
        : null;

    const fundingSource = await this.fundingSourceService.getDetailById(financeProduct.fundingSourceId);
    if (!fundingSource) {
      throw ApplicationException.EntityNotFound('funding Source');
    }

    const detailedQuote = {
      systemProduction: systemDesign.systemProductionData,
      quoteCostBuildup,
      utilityProgram: utilityProgramDetail
        ? {
            utilityProgramId: utilityProgramDetail.id,
            utilityProgramName: utilityProgramDetail.utilityProgramName,
            rebateAmount: utilityProgramDetail.rebateAmount,
            utilityProgramDataSnapshot: {
              id: utilityProgramDetail.id,
              name: utilityProgramDetail.utilityProgramName,
              rebateAmount: utilityProgramDetail.rebateAmount,
            },
            utilityProgramDataSnapshotDate: new Date(),
          }
        : null,
      quoteFinanceProduct: {
        financeProduct: {
          productType: financeProduct.productType,
          fundingSourceId: financeProduct.fundingSourceId,
          fundingSourceName: financeProduct.fundingSourceName,
          productAttribute,
          financialProductSnapshot: financeProduct.financialProductSnapshot,
        },
        netAmount: quoteCostBuildup.grossPrice,
        incentiveDetails,
        rebateDetails,
        projectDiscountDetails,
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
    };

    detailedQuote.quoteFinanceProduct = this.handleUpdateQuoteFinanceProduct(
      detailedQuote.quoteFinanceProduct as any,
      detailedQuote.quoteCostBuildup as any,
    ) as any;

    detailedQuote.quoteFinanceProduct.rebateDetails = await this.createRebateDetails(
      data.opportunityId,
      grossPriceData.grossPrice ?? 0,
      fundingSource.rebateAssignment,
      rebateDetails.filter(item => item.type !== REBATE_TYPE.ITC),
    );

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(true);

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
        return { ...q, editable: !isInUsed };
      }),
    );

    const data = strictPlainToClass(QuoteDto, checkedQuotes);
    const result = {
      data,
      total: count,
    };

    return OperationResult.ok(new Pagination(result));
  }

  async getAllTaxCredits(): Promise<OperationResult<Pagination<TaxCreditDto>>> {
    const [taxCredits, total] = await Promise.all([
      this.taxCreditConfigModel.find().lean(),
      this.taxCreditConfigModel.estimatedDocumentCount().lean(),
    ]);
    const data = strictPlainToClass(TaxCreditDto, taxCredits);
    const result = {
      data,
      total,
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
      } as any),
    );
  }

  async updateQuote(quoteId: ObjectId, data: UpdateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const isInUsed = await this.checkInUsed(quoteId.toString());

    if (isInUsed) {
      throw new BadRequestException('This quote has been used in either proposal or contract');
    }

    const foundQuote = await this.quoteModel.findById(quoteId).lean();
    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId.toString());
    }

    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('system Design');
    }

    const taxCreditData = data.taxCreditData?.length
      ? await this.taxCreditConfigModel
          .find({
            _id: data.taxCreditData.map(({ taxCreditConfigDataId }) => Types.ObjectId(taxCreditConfigDataId)),
          })
          .lean()
      : [];

    const detailedQuote = {
      ...data,
      systemProduction: systemDesign.systemProductionData,
      quoteName: data.quoteName || foundQuote.detailedQuote.quoteName,
      isSelected: typeof data.isSelected === 'boolean' ? data.isSelected : foundQuote.detailedQuote.isSelected,
      isSolar: systemDesign.isSolar,
      isRetrofit: systemDesign.isRetrofit,
      taxCreditData: taxCreditData as unknown,
    };

    const model = new QuoteModel(data, detailedQuote);

    model.setIsSync(data.isSync);

    const removedUndefined = pickBy(model, item => typeof item !== 'undefined');

    // removedUndefined.detailedQuote?.quoteFinanceProduct.incentiveDetails

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

    // I think this below variable show average money that customer have to pay monthly
    const monthlyUtilityPayment = cost.reduce((acc, item) => (acc += item.v), 0) / cost.length;

    let res: CalculateQuoteDetailDto = {} as any;
    switch (data.quoteFinanceProduct.financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE:
        res = await this.calculationService.calculateLeaseQuote(data, monthlyUtilityPayment);
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

    // TODO: Tier/StorageManufacturer support
    const query: IGetDetail = {
      tier: 'DTC',
      isSolar: data.isSolar,
      utilityProgramName: data.utilityProgram.utilityProgramName || 'PRP2',
      contractTerm: productAttribute.leaseTerm,
      storageSize: sumBy(data.quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizekWh),
      storageManufacturer: 'Tesla',
      rateEscalator: productAttribute.rateEscalator,
      capacityKW: data.systemProduction.capacityKW,
      productivity: data.systemProduction.productivity,
    };

    const foundLeaseSolverConfig = await this.leaseSolverConfigService.getDetailByConditions(query);
    if (foundLeaseSolverConfig) {
      return OperationResult.ok('Found One Entity');
    }

    const leaseSolverConfig = await this.leaseSolverConfigService.getListSolverConfigsByConditions(
      data.isSolar,
      data.utilityProgram.utilityProgramName || 'PRP2',
    );

    if (!leaseSolverConfig.length) {
      throw ApplicationException.NotFoundStatus('Lease Config');
    }

    const solarSizeMinimumArr = leaseSolverConfig.map(item => item.solarSizeMinimum);
    const solarSizeMaximumArr = leaseSolverConfig.map(item => item.solarSizeMaximum);
    const productivityMinArr = leaseSolverConfig.map(item => item.productivityMin);
    const productivityMaxArr = leaseSolverConfig.map(item => item.productivityMax);

    throw ApplicationException.UnprocessableEntity(
      `System capacity should be between ${min(solarSizeMinimumArr)} and ${max(
        solarSizeMaximumArr,
      )} and productivity should be between ${min(productivityMinArr)} and ${max(productivityMaxArr)}`,
    );
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

  groupData(data: any[], field: string): any {
    const groupByField = groupBy(data, item => item[field]);
    return Object.keys(groupByField).reduce(
      (acc, item) => [
        ...acc,
        {
          ...groupByField[item]?.[0],
          quantity: sumBy(groupByField[item], (i: any) => i.quantity),
          cost: sumBy(groupByField[item], (i: any) => i.cost),
        },
      ],
      [],
    );
  }

  async setOutdatedData(opportunityId: string, outdatedMessage: string): Promise<void> {
    const quotes = await this.quoteModel.find({ opportunityId });

    await Promise.all(
      quotes.map(item => {
        item.isSync = false;
        item.isSyncMessages.push(outdatedMessage);
        item.isSyncMessages = uniq(item.isSyncMessages);
        return item.save();
      }),
    );
  }

  private getSubcontractorMarkup(
    productType: COMPONENT_TYPE,
    productCategory: PRODUCT_CATEGORY_TYPE,
    quoteMarkupConfigs: LeanDocument<QuoteMarkupConfig>[],
  ): number {
    const found = quoteMarkupConfigs.find(
      item => item.productType === productType && item.productCategory === productCategory,
    );
    return found?.subcontractorMarkup ?? 0;
  }

  // ->>>>>>>>>>>>>>> CALCULATION <<<<<<<<<<<<<<<<<<-

  calculateLaborCost(
    systemDesign: LeanDocument<SystemDesign>,
    laborCostDataSnapshot: LaborCostDetails,
  ): { cost: number; laborCostType: ELaborCostType | '' } {
    const storage = systemDesign?.roofTopDesignData?.storage[0];

    if (systemDesign.isRetrofit) {
      return {
        cost: laborCostDataSnapshot.storageRetrofitLaborFeePerProject,
        laborCostType: ELaborCostType.STORAGE_RETROFIT_LABOR_FEE_PER_PROJECT,
      };
    }

    if (!storage) {
      return {
        cost: laborCostDataSnapshot.solarOnlyLaborFeePerWatt,
        laborCostType: ELaborCostType.SOLAR_ONLY_LABOR_FEE_PER_WATT,
      };
    }

    if (storage.batteryType === 'AC') {
      return {
        cost: laborCostDataSnapshot.solarWithACStorageLaborFeePerProject,
        laborCostType: ELaborCostType.SOLAR_WITH_AC_STORAGE_LABOR_FEE_PER_PROJECT,
      };
    }

    if (storage.batteryType === 'DC') {
      return {
        cost: laborCostDataSnapshot.solarWithDCStorageLaborFeePerProject,
        laborCostType: ELaborCostType.SOLAR_WITH_DC_STORAGE_LABOR_FEE_PER_PROJECT,
      };
    }

    return {
      cost: 0,
      laborCostType: '',
    };
  }

  calculateGrossPrice(data: any): { totalNetCost: number; grossPrice: number } {
    const adderNetCost = sumBy(data.adderQuoteDetails, (i: any) => i.netCost);
    const storageNetCost = sumBy(data.storageQuoteDetails, (i: any) => i.netCost);
    const inverterNetCost = sumBy(data.inverterQuoteDetails, (i: any) => i.netCost);
    const panelNetCost = sumBy(data.panelQuoteDetails, (i: any) => i.netCost);
    const bosNetCost = sumBy(data.bosDetails, (i: any) => i.netCost);
    const ancillaryNetCost = sumBy(data.ancillaryEquipmentDetails, (i: any) => i.netCost);
    const laborCost = data.laborCost?.cost || 0;

    const totalNetCost =
      adderNetCost + storageNetCost + inverterNetCost + panelNetCost + bosNetCost + ancillaryNetCost + laborCost;
    return {
      totalNetCost,
      grossPrice: totalNetCost * (1 + data.swellStandardMarkup / 100 || 0),
    };
  }

  handleUpdateQuoteFinanceProduct(
    quoteFinanceProduct: QuoteFinanceProductDto,
    quoteCostBuildup: QuoteCostBuildupDto,
  ): QuoteFinanceProductDto {
    const { incentiveDetails, projectDiscountDetails, rebateDetails } = quoteFinanceProduct;

    const newQuoteFinanceProduct = { ...quoteFinanceProduct };
    const incentiveAmount = incentiveDetails.reduce((acc, item) => (acc += item.amount), 0);

    const rebateAmount = rebateDetails.reduce((accu, item) => (accu += item.amount), 0);

    const projectDiscountAmount = projectDiscountDetails.reduce((accu, item) => {
      if (item.type === PROJECT_DISCOUNT_UNITS.AMOUNT) return (accu += item.amount);
      return (accu += roundNumber((item.amount * quoteCostBuildup.grossPrice) / 100, 2));
    }, 0);

    newQuoteFinanceProduct.netAmount = roundNumber(
      quoteCostBuildup.grossPrice - incentiveAmount - rebateAmount - projectDiscountAmount,
      2,
    );
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

  convertIncrementAdder(increment: string): COST_UNIT_TYPE {
    switch (increment) {
      case 'watt':
        return COST_UNIT_TYPE.PER_WATT;
      case 'foot':
        return COST_UNIT_TYPE.PER_FEET;
      case 'each':
        return COST_UNIT_TYPE.PER_EACH;
      default:
        return '' as any;
    }
  }

  async getDiscounts(): Promise<OperationResult<Pagination<DiscountsDto>>> {
    const data = await this.discountsModel.find().lean();
    if (!data.length) {
      return OperationResult.ok(new Pagination({ total: 0, data: [] }));
      // throw ApplicationException.EntityNotFound();
    }
    const toDay = new Date().getTime();
    const activeDiscounts = data.filter(discount => {
      const startDate = discount.startDate ? new Date(discount.startDate).getTime() : null;
      const endDate = discount.endDate ? new Date(discount.endDate).getTime() : null;
      if (!startDate && !endDate) {
        // today
        return true;
      }
      if (!startDate && endDate) {
        // only month of End Date
        return toDay <= endDate;
      }
      if (startDate && !endDate) {
        return startDate <= toDay;
      }
      return (startDate as any) <= toDay && toDay <= (endDate as any);
    });

    const quote = await this.quoteModel.find({}, { 'detailedQuote.quoteFinanceProduct.projectDiscountDetails': 1 });
    const usedDiscounts: any = quote.reduce((acc, cur): any => {
      const { projectDiscountDetails } = cur.detailedQuote.quoteFinanceProduct;
      acc = [...acc, ...projectDiscountDetails] as any;
      return acc;
    }, []);

    const result = differenceBy(activeDiscounts, usedDiscounts, '_id');

    return OperationResult.ok(new Pagination({ total: result.length, data: strictPlainToClass(DiscountsDto, result) }));
  }

  async createRebateDetails(
    opportunityId: string,
    grossPrice: number,
    rebateAssignment: string,
    existingRebateDetails?: IRebateDetailsSchema[],
  ): Promise<IRebateDetailsSchema[]> {
    const [v2Itc, rebatePrograms] = await Promise.all([
      this.iTCModel.findOne().lean(),
      this.rebateProgramService.findByOpportunityId(opportunityId),
    ]);

    const itcRate = v2Itc?.itcRate ?? 0;

    let isFloatRebate = rebateAssignment === 'customer' ? true : rebateAssignment === 'swell' && false;

    const rebateDetails: IRebateDetailsSchema[] = [
      {
        amount: (itcRate * grossPrice) / 100,
        type: REBATE_TYPE.ITC,
        description: '',
        isFloatRebate: true,
      },
    ];

    rebatePrograms.forEach(rebateProgram => {
      if (existingRebateDetails?.length) {
        const foundedRebate = existingRebateDetails.find(item => item.type === rebateProgram.name);
        isFloatRebate = foundedRebate ? !!foundedRebate?.isFloatRebate : isFloatRebate;
      }

      rebateDetails.push({
        amount: 0,
        type: rebateProgram.name,
        description: '',
        isFloatRebate:
          !existingRebateDetails?.length && rebateProgram.name === REBATE_TYPE.SGIP ? false : isFloatRebate,
      });
    });

    return rebateDetails;
  }

  async checkInUsed(quoteId: string): Promise<boolean> {
    const hasProposals = await this.proposalService.existByQuoteId(quoteId);

    if (hasProposals) {
      return hasProposals;
    }

    const hasContracts = await this.contractService.existsByQuoteId(quoteId);
    return hasContracts;
  }
}
