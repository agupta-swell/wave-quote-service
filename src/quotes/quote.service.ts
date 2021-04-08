/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { differenceBy, groupBy, isNil, max, min, omitBy, pickBy, sumBy, uniq } from 'lodash';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { FinancialProductDto } from 'src/financial-products/res/financial-product.dto';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { QuotePartnerConfigService } from 'src/quote-partner-configs/quote-partner-config.service';
import { COMPONENT_TYPE, COST_UNIT_TYPE, PRODUCT_CATEGORY_TYPE } from 'src/system-designs/constants';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { getBooleanString } from 'src/utils/common';
import { roundNumber } from 'src/utils/transformNumber';
import { OperationResult, Pagination } from '../app/common';
import { CashPaymentConfigService } from '../cash-payment-configs/cash-payment-config.service';
import { LeaseSolverConfigService } from '../lease-solver-configs/lease-solver-config.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { toCamelCase } from '../utils/transformProperties';
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
    private readonly financialProductService: FinancialProductsService,
    private readonly cashPaymentConfigService: CashPaymentConfigService,
    private readonly calculationService: CalculationService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
    private readonly quotePartnerConfigService: QuotePartnerConfigService,
  ) {}

  async createQuote(data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const [systemDesign, markupConfigs, quoteConfigData, v2_itc] = await Promise.all([
      this.systemDesignService.getOneById(data.systemDesignId),
      this.quoteMarkupConfigModel.find({ partnerId: data.partnerId }).lean(),
      this.quotePartnerConfigService.getDetailByPartnerId(data.partnerId),
      this.iTCModel.findOne().lean(),
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
        systemDesign.roof_top_design_data.panel_array.map(item => {
          const cost = item.number_of_panels * item.panel_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.SOLAR,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            panelModelId: item.panel_model_id,
            panelModelDataSnapshot: item.panel_model_data_snapshot,
            panelModelSnapshotDate: new Date(),
            quantity: item.number_of_panels,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'panelModelId',
      ),
      inverterQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.inverters.map(item => {
          const cost = item.quantity * item.inverter_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.INVERTER,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            inverterModelId: item.inverter_model_id,
            inverterModelDataSnapshot: item.inverter_model_data_snapshot,
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
        systemDesign.roof_top_design_data.storage.map(item => {
          const cost = item.quantity * item.storage_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.STORAGE,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            storageModelId: item.storage_model_id,
            storageModelDataSnapshot: item.storage_model_data_snapshot,
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
        systemDesign.roof_top_design_data.adders.map(item => {
          const cost = item.quantity * item.adder_model_data_snapshot.price;
          const subcontractorMarkup = 0;
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            adderModelId: item.adder_id,
            adderModelDataSnapshot: item.adder_model_data_snapshot,
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
        systemDesign.roof_top_design_data.balance_of_systems?.map(item => {
          const cost = item.balance_of_system_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.balance_of_system_model_data_snapshot.related_component,
            PRODUCT_CATEGORY_TYPE.BOS,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            balanceOfSystemModelId: item.balance_of_system_id,
            balanceOfSystemModelDataSnapshot: item.balance_of_system_model_data_snapshot,
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
        systemDesign.roof_top_design_data.ancillary_equipments?.map(item => {
          const cost = item.quantity * item.ancillary_equipment_model_data_snapshot.average_whole_sale_price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.ancillary_equipment_model_data_snapshot.related_component,
            PRODUCT_CATEGORY_TYPE.ANCILLARY,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            ancillaryEquipmentId: item.ancillary_id,
            ancillaryEquipmentModelDataSnapshot: item.ancillary_equipment_model_data_snapshot,
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
      systemProduction: systemDesign.system_production_data,
      quoteCostBuildup,
      utilityProgram: utilityProgram && {
        utilityProgramId: utilityProgram.id,
        utilityProgramName: utilityProgram.utility_program_name,
        rebateAmount: utilityProgram.rebate_amount,
        utilityProgramDataSnapshot: {
          id: utilityProgram.id,
          name: utilityProgram.utility_program_name,
          rebateAmount: utilityProgram.rebate_amount,
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
            financialProduct?.default_down_payment || 0,
          ),
          financialProductSnapshot: new FinancialProductDto(financialProduct),
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
        rebateDetails: this.createRebateDetails({
          utilityProgramName: utilityProgram?.utility_program_name ?? '',
          itcRate: v2_itc?.itc_rate ?? 0,
          grossPrice: grossPriceData.grossPrice ?? 0,
        }) as IRebateDetailsSchema[],
        projectDiscountDetails: [],
      },
      utilityProgramSelectedForReinvestment: false,
      taxCreditSelectedForReinvestment: false,
      savingsDetails: [],
      isSelected: false,
      isSolar: systemDesign.is_solar,
      isRetrofit: systemDesign.is_retrofit,
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

    return OperationResult.ok(new QuoteDto(obj.toObject())) as any;
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

  async updateLatestQuote(data: CreateQuoteDto, quoteId?: string): Promise<OperationResult<QuoteDto>> {
    const [foundQuote, v2_itc, systemDesign, markupConfigs] = await Promise.all([
      this.quoteModel.findById(quoteId).lean(),
      this.iTCModel.findOne().lean(),
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
      quote_finance_product: {
        incentive_details,
        project_discount_details,
        rebate_details,
        finance_product,
        financial_product_snapshot,
      },
      utility_program,
    } = foundQuote.detailed_quote;

    const quoteCostBuildup = {
      panelQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.panel_array.map(item => {
          const cost = item.number_of_panels * item.panel_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.SOLAR,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            panelModelId: item.panel_model_id,
            panelModelDataSnapshot: item.panel_model_data_snapshot,
            panelModelSnapshotDate: new Date(),
            quantity: item.number_of_panels,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'panelModelId',
      ),
      inverterQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.inverters.map(item => {
          const cost = item.quantity * item.inverter_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.INVERTER,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            inverterModelId: item.inverter_model_id,
            inverterModelDataSnapshot: item.inverter_model_data_snapshot,
            inverterModelSnapshotDate: new Date(),
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'inverterModelId',
      ),
      storageQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.storage.map(item => {
          const cost = item.quantity * item.storage_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            COMPONENT_TYPE.STORAGE,
            PRODUCT_CATEGORY_TYPE.BASE,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            storageModelId: item.storage_model_id,
            storageModelDataSnapshot: item.storage_model_data_snapshot,
            storageModelSnapshotDate: new Date(),
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'storageModelId',
      ),
      adderQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.adders.map(item => {
          const cost = item.quantity * item.adder_model_data_snapshot.price;
          const subcontractorMarkup = 0;
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            adderModelId: item.adder_id,
            adderModelDataSnapshot: item.adder_model_data_snapshot,
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
        systemDesign.roof_top_design_data.balance_of_systems.map(item => {
          const cost = item.balance_of_system_model_data_snapshot.price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.balance_of_system_model_data_snapshot.related_component,
            PRODUCT_CATEGORY_TYPE.BOS,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            balanceOfSystemModelId: item.balance_of_system_id,
            balanceOfSystemModelDataSnapshot: item.balance_of_system_model_data_snapshot,
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
        systemDesign.roof_top_design_data.ancillary_equipments.map(item => {
          const cost = item.quantity * item.ancillary_equipment_model_data_snapshot.average_whole_sale_price;
          const subcontractorMarkup = this.getSubcontractorMarkup(
            item.ancillary_equipment_model_data_snapshot.related_component,
            PRODUCT_CATEGORY_TYPE.ANCILLARY,
            markupConfigs,
          );
          const netCost = cost * (1 + subcontractorMarkup / 100);

          return {
            ancillaryEquipmentId: item.ancillary_id,
            ancillaryEquipmentModelDataSnapshot: item.ancillary_equipment_model_data_snapshot,
            ancillaryEquipmentSnapshotDate: new Date(),
            quantity: item.quantity,
            cost,
            subcontractorMarkup,
            netCost,
          };
        }),
        'ancillaryEquipmentId',
      ),
      swellStandardMarkup: foundQuote.detailed_quote.quote_cost_buildup.swell_standard_markup || 0,
      laborCost: {
        laborCostDataSnapshot: {
          id: foundQuote.detailed_quote.quote_cost_buildup.labor_cost.labor_cost_data_snapshot.id,
          solarOnlyLaborFeePerWatt:
            foundQuote.detailed_quote.quote_cost_buildup.labor_cost.labor_cost_data_snapshot
              .solar_only_labor_fee_per_watt,
          storageRetrofitLaborFeePerProject:
            foundQuote.detailed_quote.quote_cost_buildup.labor_cost.labor_cost_data_snapshot
              .storage_retrofit_labor_fee_per_project,
          solarWithACStorageLaborFeePerProject:
            foundQuote.detailed_quote.quote_cost_buildup.labor_cost.labor_cost_data_snapshot
              .solar_with_a_c_storage_labor_fee_per_project,
          solarWithDCStorageLaborFeePerProject:
            foundQuote.detailed_quote.quote_cost_buildup.labor_cost.labor_cost_data_snapshot
              .solar_with_d_c_storage_labor_fee_per_project,
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
      finance_product.product_type,
      quoteCostBuildup.grossPrice,
      financial_product_snapshot?.default_down_payment || 0,
    );
    const { product_attribute } = finance_product as any;
    switch (finance_product.product_type) {
      case FINANCE_PRODUCT_TYPE.LEASE: {
        productAttribute = {
          ...productAttribute,
          rateEscalator: product_attribute.rate_escalator,
          leaseTerm: product_attribute.lease_term,
        } as LeaseProductAttributesDto;
        break;
      }
      case FINANCE_PRODUCT_TYPE.LOAN: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfront_payment,
          interestRate: product_attribute.interest_rate,
          loanTerm: product_attribute.loan_term,
        } as LoanProductAttributesDto;
        break;
      }

      default: {
        productAttribute = {
          ...productAttribute,
          upfrontPayment: product_attribute.upfront_payment,
        } as CashProductAttributesDto;
        break;
      }
    }

    const detailedQuote = {
      systemProduction: systemDesign.system_production_data,
      quoteCostBuildup,
      utilityProgram: utility_program
        ? {
            utilityProgramId: utility_program.utility_program_id,
            utilityProgramName: utility_program.utility_program_name,
            rebateAmount: utility_program.rebate_amount,
            utilityProgramDataSnapshot: {
              id: utility_program.utility_program_id,
              name: utility_program.utility_program_name,
              rebateAmount: utility_program.rebate_amount,
            },
            utilityProgramDataSnapshotDate: utility_program.utility_program_data_snapshot_date,
          }
        : null,
      quoteFinanceProduct: {
        financeProduct: {
          productType: finance_product.product_type,
          fundingSourceId: finance_product.funding_source_id,
          fundingSourceName: finance_product.funding_source_name,
          productAttribute,
          financialProductSnapshot: toCamelCase(finance_product.financial_product_snapshot),
        },
        netAmount: quoteCostBuildup.grossPrice,
        incentiveDetails: incentive_details,
        rebateDetails: rebate_details.map((item: any) => toCamelCase(item)),
        projectDiscountDetails: project_discount_details.map((item: any) => toCamelCase(item)),
      },
      savingsDetails: [],
      quoteName: foundQuote.detailed_quote.quote_name,
      isSelected: foundQuote.detailed_quote.is_selected,
      isSolar: foundQuote.detailed_quote.is_solar,
      isRetrofit: foundQuote.detailed_quote.is_retrofit,
      selectedQuoteMode: foundQuote.detailed_quote.selected_quote_mode,
      allowedQuoteModes: foundQuote.detailed_quote.allowed_quote_modes,
      quotePricePerWatt: foundQuote.detailed_quote.quote_price_per_watt,
      quotePriceOverride: foundQuote.detailed_quote.quote_price_override,
      notes: foundQuote.detailed_quote.notes,
    };

    detailedQuote.quoteFinanceProduct = this.handleUpdateQuoteFinanceProduct(
      detailedQuote.quoteFinanceProduct as any,
      detailedQuote.quoteCostBuildup as any,
    );

    detailedQuote.quoteFinanceProduct.rebateDetails = this.createRebateDetails({
      utilityProgramName: utility_program?.utility_program_name ?? '',
      itcRate: v2_itc?.itc_rate ?? 0,
      grossPrice: grossPriceData.grossPrice ?? 0,
    });

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(true);

    return OperationResult.ok(new QuoteDto({ ...model, _id: foundQuote._id } as any));
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
        system_design_id: systemDesignId,
        opportunity_id: opportunityId,
        is_sync: typeof isSync === 'undefined' ? undefined : getBooleanString(isSync),
      },
      isNil,
    );

    const [quotes, count] = await Promise.all([
      this.quoteModel.find(condition).limit(limit).skip(skip).lean(),
      this.quoteModel.countDocuments(condition).lean(),
    ]);

    const data = quotes.map(item => new QuoteDto(item));
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
    const data = taxCredits.map(item => new TaxCreditDto(item));
    const result = {
      data,
      total,
    };
    return OperationResult.ok(new Pagination(result));
  }

  async getDetailQuote(quoteId: string): Promise<OperationResult<QuoteDto>> {
    const quote = await this.quoteModel.findById(quoteId).lean();
    const itc_rate = await this.iTCModel.findOne().lean();

    if (!quote) {
      throw ApplicationException.EntityNotFound(quoteId);
    }

    return OperationResult.ok(new QuoteDto(quote, itc_rate?.itc_rate));
  }

  async updateQuote(quoteId: string, data: UpdateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const foundQuote = await this.quoteModel.findById(quoteId).lean();
    if (!foundQuote) {
      throw ApplicationException.EntityNotFound(quoteId);
    }

    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);
    if (!systemDesign) {
      throw ApplicationException.EntityNotFound('system Design');
    }

    const taxCreditData = await Promise.all(
      (data.taxCreditData || []).map(item =>
        this.taxCreditConfigModel.findOne({ _id: item.taxCreditConfigDataId }).lean(),
      ),
    );

    const detailedQuote = {
      ...data,
      systemProduction: toCamelCase(systemDesign.system_production_data),
      quoteName: data.quoteName || foundQuote.detailed_quote.quote_name,
      isSelected: typeof data.isSelected === 'boolean' ? data.isSelected : foundQuote.detailed_quote.is_selected,
      isSolar: systemDesign.is_solar,
      isRetrofit: systemDesign.is_retrofit,
      taxCreditData: taxCreditData.map(item => toCamelCase(item)),
    };
    const model = new QuoteModel(data, detailedQuote);

    model.setIsSync(data.isSync);

    const removedUndefined = pickBy(model, item => typeof item !== 'undefined');

    const savedQuote = await this.quoteModel.findByIdAndUpdate(quoteId, removedUndefined, { new: true }).lean();

    return OperationResult.ok(new QuoteDto(savedQuote || ({} as any)));
  }

  async calculateQuoteDetail(data: CalculateQuoteDetailDto): Promise<OperationResult<QuoteDto>> {
    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);
    const cost = systemDesign?.cost_post_installation?.cost || [];

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

  async getValidationForLease(data: CalculateQuoteDetailDto): Promise<OperationResult<string>> {
    const productAttribute = data.quoteFinanceProduct.financeProduct.productAttribute as LeaseProductAttributesDto;

    const query = {
      isSolar: data.isSolar,
      isRetrofit: data.isRetrofit,
      utilityProgramName: data.utilityProgram.utilityProgramName || 'PRP2',
      contractTerm: productAttribute.leaseTerm,
      storageSize: sumBy(data.quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizekWh),
      rateEscalator: productAttribute.rateEscalator,
      capacityKW: data.systemProduction.capacityKW,
      productivity: data.systemProduction.productivity,
    };

    let leaseSolverConfig: any;

    leaseSolverConfig = await this.leaseSolverConfigService.getDetailByConditions(query);
    if (leaseSolverConfig) {
      return OperationResult.ok('Found One Entity');
    }

    leaseSolverConfig = await this.leaseSolverConfigService.getListSolverCofigsByConditions(
      data.isSolar,
      data.isRetrofit,
      data.utilityProgram.utilityProgramName || 'PRP2',
    );

    if (!leaseSolverConfig.length) {
      throw ApplicationException.NotFoundStatus('Lease Config');
    }

    const solarSizeMinimumArr = leaseSolverConfig.map((item: any) => item.solar_size_minimum);
    const solarSizeMaximumArr = leaseSolverConfig.map((item: any) => item.solar_size_maximum);
    const productivityMinArr = leaseSolverConfig.map((item: any) => item.productivity_min);
    const productivityMaxArr = leaseSolverConfig.map((item: any) => item.productivity_max);

    throw ApplicationException.UnprocessableEntity(
      `System capacity should be between ${min(solarSizeMinimumArr)} and ${max(
        solarSizeMaximumArr,
      )} and productivity should be between ${min(productivityMinArr)} and ${max(productivityMaxArr)}`,
    );
  }

  // ->>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<<-\

  async getOneById(id: string): Promise<IDetailedQuoteSchema | undefined> {
    const res = await this.quoteModel.findById(id).lean();
    return res?.detailed_quote;
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
    const quotes = await this.quoteModel.find({ opportunity_id: opportunityId });

    await Promise.all(
      quotes.map(item => {
        item.is_sync = false;
        item.is_sync_messages.push(outdatedMessage);
        item.is_sync_messages = uniq(item.is_sync_messages);
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
    const storage = systemDesign?.roof_top_design_data?.storage[0];

    if (systemDesign.is_retrofit) {
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

    if (storage.battery_type === 'AC') {
      return {
        cost: laborCostDataSnapshot.solarWithACStorageLaborFeePerProject,
        laborCostType: ELaborCostType.SOLAR_WITH_AC_STORAGE_LABOR_FEE_PER_PROJECT,
      };
    }

    if (storage.battery_type === 'DC') {
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
    const counter = await this.quoteModel.countDocuments({ opportunity_id: opportunityId });
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

    const quote = await this.quoteModel.find(
      {},
      { 'detailed_quote.quote_finance_product.project_discount_details': 1 },
    );
    const usedDiscounts: any = quote.reduce((acc, cur): any => {
      const { project_discount_details } = cur.detailed_quote.quote_finance_product;
      acc = [...acc, ...project_discount_details] as any;
      return acc;
    }, []);

    const result = differenceBy(activeDiscounts, usedDiscounts, '_id');

    return OperationResult.ok(new Pagination({ total: result.length, data: result.map(i => new DiscountsDto(i)) }));
  }

  createRebateDetails({
    utilityProgramName,
    itcRate,
    grossPrice,
  }: {
    utilityProgramName: string;
    itcRate: number;
    grossPrice: number;
  }): IRebateDetailsSchema[] {
    const rebateDetails: IRebateDetailsSchema[] = [];
    rebateDetails.push({
      amount: (itcRate * grossPrice) / 100,
      type: REBATE_TYPE.ITC,
      description: '',
    });
    if (utilityProgramName && utilityProgramName.includes('+SGIP')) {
      rebateDetails.push({
        amount: 0,
        type: REBATE_TYPE.SGIP,
        description: '',
      });
    }
    return rebateDetails;
  }
}
