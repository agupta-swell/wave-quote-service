import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, max, min, pick, pickBy, sumBy } from 'lodash';
import { Model } from 'mongoose';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { UtilityProgramService } from 'src/utility-programs/utility-program.service';
import { roundNumber } from 'src/utils/transformNumber';
import { LeaseSolverConfigService } from '../lease-solver-configs/lease-solver-config.service';
import { toCamelCase } from '../utils/transformProperties';
import { ApplicationException } from './../app/app.exception';
import { OperationResult, Pagination } from './../app/common';
import { CashPaymentConfigService } from './../cash-payment-configs/cash-payment-config.service';
import { SystemDesignService } from './../system-designs/system-design.service';
import { FINANCE_PRODUCT_TYPE, INCENTIVE_APPLIES_TO_VALUE, INCENTIVE_UNITS, PROJECT_DISCOUNT_UNITS } from './constants';
import { Quote, QUOTE, QuoteModel } from './quote.schema';
import { CalculateQuoteDetailDto, CreateQuoteDto, UpdateQuoteDto } from './req';
import {
  CashProductAttributesDto,
  IncentiveDetailsDto,
  LeaseProductAttributesDto,
  LoanProductAttributesDto,
  QuoteCostBuildupDto,
  QuoteFinanceProductDto,
} from './req/sub-dto';
import { QuoteDto } from './res/quote.dto';
import { TaxCreditDto } from './res/tax-credit.dto';
import { TaxCreditConfig, TAX_CREDIT_CONFIG } from './schemas/tax-credit-config.schema';
import { CalculationService } from './sub-services/calculation.service';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(QUOTE) private readonly quoteModel: Model<Quote>,
    @InjectModel(TAX_CREDIT_CONFIG) private readonly taxCreditConfigModel: Model<TaxCreditConfig>,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly utilityProgramService: UtilityProgramService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly cashPaymentConfigService: CashPaymentConfigService,
    private readonly calculationService: CalculationService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
  ) {}

  async createQuote(data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);

    const quoteCostCommon = {
      cost: 0,
      markup: 0,
      discountDetails: [{ amount: 0, description: '' }],
      netCost: 0,
    };

    const quoteCostBuildup = {
      panelQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.panel_array.map(item => ({
          panelModelId: item.panel_model_id,
          panelModelDataSnapshot: item.panel_model_data_snapshot,
          panelModelSnapshotDate: new Date(),
          quantity: item.number_of_panels,
          ...quoteCostCommon,
          cost: item.number_of_panels * item.panel_model_data_snapshot.price,
        })),
        'panelModelId',
      ),
      inverterQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.inverters.map(item => ({
          inverterModelId: item.inverter_model_id,
          inverterModelDataSnapshot: item.inverter_model_data_snapshot,
          inverterModelSnapshotDate: new Date(),
          ...quoteCostCommon,
          quantity: item.quantity,
          cost: item.quantity * item.inverter_model_data_snapshot.price,
        })),
        'inverterModelId',
      ),
      storageQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.storage.map(item => ({
          storageModelId: item.storage_model_id,
          storageModelDataSnapshot: item.storage_model_data_snapshot,
          storageModelSnapshotDate: new Date(),
          ...quoteCostCommon,
          quantity: item.quantity,
          cost: item.quantity * item.storage_model_data_snapshot.price,
        })),
        'storageModelId',
      ),
      adderQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.adders.map(item => ({
          adderModelId: item.adder_id,
          adderModelDataSnapshot: item.adder_model_data_snapshot,
          adderModelSnapshotDate: new Date(),
          ...quoteCostCommon,
          quantity: item.quantity,
          cost: item.quantity * item.adder_model_data_snapshot.price,
        })),
        'adderModelId',
      ),
      overallMarkup: 0,
      totalProductCost: 0,
      laborCost: {
        laborCostDataSnapshot: {
          calculationType: 'standard',
          unit: 'each',
        },
        laborCostSnapshotDate: new Date(),
        ...quoteCostCommon,
        netCost: 0,
      },
      grossAmount: 0,
    };

    quoteCostBuildup.totalProductCost = this.calculateTotalProductCost(quoteCostBuildup);
    quoteCostBuildup.grossAmount = quoteCostBuildup.totalProductCost - quoteCostBuildup.laborCost.netCost;

    const utilityProgram = await this.utilityProgramService.getDetail(data.utilityProgramId);
    const fundingSource = await this.fundingSourceService.getDetail(data.fundingSourceId);

    const detailedQuote = {
      systemProduction: systemDesign.system_production_data,
      quoteCostBuildup,
      utilityProgram: {
        utilityProgramId: utilityProgram?.id,
        utilityProgramName: utilityProgram?.name,
        rebateAmount: utilityProgram?.rebate_amount,
        utility_program_data_snapshot: {
          id: utilityProgram?.id,
          name: utilityProgram?.name,
          rebateAmount: utilityProgram?.rebate_amount,
        },
        utility_program_data_snapshot_date: new Date(),
      },
      quoteFinanceProduct: {
        financeProduct: {
          productType: fundingSource.type,
          fundingSourceId: fundingSource.id,
          fundingSourceName: fundingSource.name,
          productAttribute: await this.createProductAttribute(fundingSource.type, quoteCostBuildup.grossAmount),
        },
        netAmount: quoteCostBuildup.grossAmount,
        incentiveDetails: [
          {
            unit: 'percentage',
            unitValue: 0,
            type: 'program_incentives',
            appliesTo: '',
            description: '',
          },
        ],
        rebateDetails: [
          {
            amount: 0,
            type: 'program_rebate',
            description: '',
          },
        ],
        projectDiscountDetails: [
          {
            unit: 'percentage',
            unitValue: 0,
            description: '',
            excludeAdders: false,
          },
        ],
      },
      utilityProgramSelectedForReinvestment: false,
      taxCreditSelectedForReinvestment: false,
      savingsDetails: [],
      quoteName: '',
      isSelected: false,
      isSolar: systemDesign.is_solar,
      isRetrofit: systemDesign.is_retrofit,
    };

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(true);

    const obj = new this.quoteModel(model);
    await obj.save();

    return OperationResult.ok(new QuoteDto(obj.toObject())) as any;
  }

  async createProductAttribute(productType: string, netAmount: number) {
    let template = {};
    switch (productType) {
      case FINANCE_PRODUCT_TYPE.LOAN:
        template = {
          upfrontPayment: 0,
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

      default:
        const cashQuoteConfig = await this.cashPaymentConfigService.getFirst();
        template = {
          upfrontPayment: 0,
          balance: netAmount,
          milestonePayment: cashQuoteConfig
            ? cashQuoteConfig
                .toObject()
                .config.map(item => ({ ...item, amount: roundNumber(netAmount * item.percentage, 2) }))
            : [],
          cashQuoteConfigSnapshot: {
            type: cashQuoteConfig.type,
            config: cashQuoteConfig.config,
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

  async getLatestQuote(data: CreateQuoteDto, quoteId?: string): Promise<OperationResult<QuoteDto>> {
    const foundQuote = await this.quoteModel.findById(quoteId);

    if (!foundQuote) {
      throw ApplicationException.EnitityNotFound(quoteId);
    }

    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);

    const quoteCostCommon = {
      markup: 0,
      discountDetails: [{ amount: 0, description: '' }],
      netCost: 0,
    };

    const {
      quote_cost_buildup: { panel_quote_details, inverter_quote_details, storage_quote_details, adder_quote_details },
      quote_finance_product: { incentive_details, project_discount_details, rebate_details, finance_product },
      utility_program,
    } = foundQuote.toObject().detailed_quote;

    const oldPanels = panel_quote_details.reduce(
      (acc, item) => ({ ...acc, [item.panel_model_id]: toCamelCase(item) }),
      {},
    );
    const oldInverters = inverter_quote_details.reduce(
      (acc, item) => ({ ...acc, [item.inverter_model_id]: toCamelCase(item) }),
      {},
    );
    const oldStorage = storage_quote_details.reduce(
      (acc, item) => ({ ...acc, [item.storage_model_id]: toCamelCase(item) }),
      {},
    );
    const oldAdders = adder_quote_details.reduce(
      (acc, item) => ({ ...acc, [item.adder_model_id]: toCamelCase(item) }),
      {},
    );

    const quoteCostBuildup = {
      panelQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.panel_array.map(item => ({
          panelModelId: item.panel_model_id,
          panelModelDataSnapshot: item.panel_model_data_snapshot,
          panelModelSnapshotDate: new Date(),
          quantity: item.number_of_panels,
          ...quoteCostCommon,
          ...pick(oldPanels[item.panel_model_id], ['markup', 'discountDetails', 'netCost']),
          cost: item.number_of_panels * item.panel_model_data_snapshot.price,
        })),
        'panelModelId',
      ),
      inverterQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.inverters.map(item => ({
          inverterModelId: item.inverter_model_id,
          inverterModelDataSnapshot: item.inverter_model_data_snapshot,
          inverterModelSnapshotDate: new Date(),
          quantity: item.quantity,
          ...quoteCostCommon,
          ...pick(oldInverters[item.inverter_model_id], ['markup', 'discountDetails', 'netCost']),
          cost: item.quantity * item.inverter_model_data_snapshot.price,
        })),
        'inverterModelId',
      ),
      storageQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.storage.map(item => ({
          storageModelId: item.storage_model_id,
          storageModelDataSnapshot: item.storage_model_data_snapshot,
          storageModelSnapshotDate: new Date(),
          quantity: item.quantity,
          ...quoteCostCommon,
          ...pick(oldStorage[item.storage_model_id], ['markup', 'discountDetails', 'netCost']),
          cost: item.quantity * item.storage_model_data_snapshot.price,
        })),
        'storageModelId',
      ),
      adderQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.adders.map(item => ({
          adderModelId: item.adder_id,
          adderModelDataSnapshot: item.adder_model_data_snapshot,
          adderModelSnapshotDate: new Date(),
          quantity: item.quantity,
          ...quoteCostCommon,
          ...pick(oldAdders[item.adder_id], ['markup', 'discountDetails', 'netCost']),
          cost: item.quantity * item.adder_model_data_snapshot.price,
        })),
        'adderModelId',
      ),
      overallMarkup: foundQuote.detailed_quote.quote_cost_buildup.overall_markup,
      totalProductCost: 0,
      laborCost: {
        laborCostDataSnapshot: {
          calculationType: 'standard',
          unit: 'each',
        },
        laborCostSnapshotDate: new Date(),
        ...quoteCostCommon,
        netCost: 0,
      },
      grossAmount: 0,
    };

    quoteCostBuildup.totalProductCost = this.calculateTotalProductCost(quoteCostBuildup);
    quoteCostBuildup.grossAmount = quoteCostBuildup.totalProductCost - quoteCostBuildup.laborCost.netCost;

    let productAttribute = await this.createProductAttribute(
      finance_product.product_type,
      quoteCostBuildup.grossAmount,
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
      utilityProgram: {
        utilityProgramId: utility_program?.utility_program_id,
        utilityProgramName: utility_program?.utility_program_name,
        rebateAmount: utility_program?.rebate_amount,
        utilityProgramDataSnapshot: {
          id: utility_program?.utility_program_id,
          name: utility_program?.utility_program_name,
        },
        utilityProgramDataSnapshotDate: utility_program.utility_program_data_snapshot_date,
      },
      quoteFinanceProduct: {
        financeProduct: {
          productType: finance_product.product_type,
          fundingSourceId: finance_product.funding_source_id,
          fundingSourceName: finance_product.funding_source_name,
          productAttribute,
        },
        netAmount: quoteCostBuildup.grossAmount,
        incentiveDetails: incentive_details.map(item => toCamelCase(item)),
        rebateDetails: rebate_details.map(item => toCamelCase(item)),
        projectDiscountDetails: project_discount_details.map(item => toCamelCase(item)),
      },
      savingsDetails: [],
      quoteName: foundQuote.detailed_quote.quote_name,
      isSelected: foundQuote.detailed_quote.is_selected,
      isSolar: foundQuote.detailed_quote.is_solar,
      isRetrofit: foundQuote.detailed_quote.is_retrofit,
    };

    detailedQuote.quoteFinanceProduct = this.handleUpdateQuoteFinanceProduct(
      detailedQuote.quoteFinanceProduct as any,
      detailedQuote.quoteCostBuildup as any,
    );

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(true);

    return OperationResult.ok(new QuoteDto({ ...model, _id: foundQuote._id } as any)) as any;
  }

  async getAllQuotes(
    limit: number,
    skip: number,
    systemDesignId: string,
  ): Promise<OperationResult<Pagination<QuoteDto>>> {
    const [quotes, total] = await Promise.all([
      this.quoteModel.find({ system_design_id: systemDesignId }).limit(limit).skip(skip).exec(),
      this.quoteModel.estimatedDocumentCount(),
    ]);
    const data = (quotes || []).map(item => new QuoteDto(item.toObject()));
    const result = {
      data,
      total,
    };
    return OperationResult.ok(result);
  }

  async getAllTaxCredits(): Promise<OperationResult<Pagination<TaxCreditDto>>> {
    const [taxCredits, total] = await Promise.all([
      this.taxCreditConfigModel.find().exec(),
      this.taxCreditConfigModel.estimatedDocumentCount(),
    ]);
    const data = (taxCredits || []).map(item => new TaxCreditDto(item.toObject()));
    const result = {
      data,
      total,
    };
    return OperationResult.ok(result);
  }

  async getDetailQuote(quoteId: string): Promise<OperationResult<QuoteDto>> {
    const quote = await this.quoteModel.findById(quoteId);
    if (!quote) {
      throw ApplicationException.EnitityNotFound(quoteId);
    }
    return OperationResult.ok(new QuoteDto(quote.toObject()));
  }

  async updateQuote(quoteId: string, data: UpdateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const foundQuote = await this.quoteModel.findById(quoteId);
    if (!foundQuote) {
      throw ApplicationException.EnitityNotFound(quoteId);
    }

    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);

    const taxCreditData = await Promise.all(
      data.taxCreditData?.map(item => this.taxCreditConfigModel.findOne({ _id: item.taxCreditConfigDataId })),
    );

    const detailedQuote = {
      ...data,
      systemProduction: toCamelCase(systemDesign.system_production_data),
      quoteName: data.quoteName || foundQuote.detailed_quote.quote_name,
      isSelected: typeof data.isSelected === 'boolean' ? data.isSelected : foundQuote.detailed_quote.is_selected,
      isSolar: systemDesign.is_solar,
      isRetrofit: systemDesign.is_retrofit,
      taxCreditData: taxCreditData.map(item => toCamelCase(item.toObject())),
    };

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(data.isSync);

    const removedUndefined = pickBy(model, item => typeof item !== 'undefined');
    const savedQuote = await this.quoteModel.findByIdAndUpdate(quoteId, removedUndefined, { new: true });
    return OperationResult.ok(new QuoteDto({ ...savedQuote.toObject() }));
  }

  async calculateQuoteDetail(data: CalculateQuoteDetailDto): Promise<OperationResult<QuoteDto>> {
    const systemDesign = await this.systemDesignService.getOneById(data.systemDesignId);
    const cost = systemDesign?.cost_post_installation?.cost || [];

    const monthlyUtilityPayment = cost.reduce((acc, item) => (acc += item.v), 0) / cost.length;

    let res: CalculateQuoteDetailDto;
    switch (data.quoteFinanceProduct.financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE:
        res = await this.calculationService.calculateLeaseQuote(data, monthlyUtilityPayment);
        break;
      case FINANCE_PRODUCT_TYPE.LOAN:
        const {
          quoteFinanceProduct: {
            financeProduct: { productAttribute },
          },
        } = data;
        const product = productAttribute as LoanProductAttributesDto;
        res = await this.calculationService.calculateLoanSolver(
          data,
          product.interestRate,
          product.loanAmount,
          new Date(),
          product.loanTerm,
          18,
          product.reinvestment?.[0]?.reinvestmentAmount || 0,
          product.reinvestment?.[0]?.reinvestmentMonth || 18,
          0.01,
          monthlyUtilityPayment,
        );
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

    leaseSolverConfig = await this.leaseSolverConfigService.getDetail(query);
    if (leaseSolverConfig) {
      return OperationResult.ok('Found One Entity');
    }

    leaseSolverConfig = await this.leaseSolverConfigService.getListSolverCofigs(
      data.isSolar,
      data.isRetrofit,
      data.utilityProgram.utilityProgramName || 'PRP2',
    );

    if (!leaseSolverConfig.length) {
      throw ApplicationException.NotFoundStatus('Lease Config');
    }

    const solarSizeMinimumArr = leaseSolverConfig.map(item => item.solar_size_minimum);
    const solarSizeMaximumArr = leaseSolverConfig.map(item => item.solar_size_maximum);
    const productivityMinArr = leaseSolverConfig.map(item => item.productivity_min);
    const productivityMaxArr = leaseSolverConfig.map(item => item.productivity_max);

    throw ApplicationException.UnprocessableEnity(
      `System capacity should be between ${min(solarSizeMinimumArr)} and ${max(
        solarSizeMaximumArr,
      )} and productivity should be between ${min(productivityMinArr)} and ${max(productivityMaxArr)}`,
    );
    return;
  }

  // ->>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<<-

  groupData(data: any[], field: string) {
    const groupByField = groupBy(data, item => item[field]);
    return Object.keys(groupByField).reduce((acc, item) => {
      return [
        ...acc,
        {
          ...groupByField[item]?.[0],
          quantity: sumBy(groupByField[item], (i: any) => i.quantity),
          cost: sumBy(groupByField[item], (i: any) => i.cost),
        },
      ];
    }, []);
  }

  async setOutdatedData(opportunityId: string) {
    const quotes = await this.quoteModel.find({ opportunity_id: opportunityId });

    await Promise.all(
      quotes.map(item => {
        item.is_sync = false;
        return item.save(item.toObject());
      }),
    );
  }

  // ->>>>>>>>>>>>>>> CALCULATION <<<<<<<<<<<<<<<<<<-

  calculateNetCostData = (totalCost = 0, discountAmount = 0, markupPercentage = 0) => {
    return roundNumber((totalCost - discountAmount) * (1 + markupPercentage), 2);
  };

  calculateTotalProductCost(data: any) {
    const adderNetCost = data.adderQuoteDetails.reduce(
      (accu, item) => (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
      0,
    );

    const storageNetCost = data.storageQuoteDetails.reduce(
      (accu, item) => (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
      0,
    );

    const inverterNetCost = data.inverterQuoteDetails.reduce(
      (accu, item) => (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
      0,
    );

    const panelNetCost = data.panelQuoteDetails.reduce(
      (accu, item) => (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
      0,
    );

    const totalNetCost = adderNetCost + storageNetCost + inverterNetCost + panelNetCost;
    return totalNetCost * (1 + data.overallMarkup || 0);
  }

  calculateIncentiveValueAmount(incentiveDetail: IncentiveDetailsDto, quoteCostBuildup: QuoteCostBuildupDto) {
    if (incentiveDetail.unit === INCENTIVE_UNITS.AMOUNT) return incentiveDetail.unitValue;
    const { appliesTo } = incentiveDetail;

    if (!appliesTo) {
      return roundNumber(incentiveDetail.unitValue * quoteCostBuildup.grossAmount, 2);
    }

    switch (appliesTo) {
      case INCENTIVE_APPLIES_TO_VALUE.SOLAR: {
        const solarNetCost = quoteCostBuildup.panelQuoteDetails.reduce(
          (accu, item) =>
            (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
          0,
        );
        return roundNumber(incentiveDetail.unitValue * solarNetCost, 2);
      }

      case INCENTIVE_APPLIES_TO_VALUE.STORAGE: {
        const storageNetCost = quoteCostBuildup.storageQuoteDetails.reduce(
          (accu, item) =>
            (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
          0,
        );
        return roundNumber(incentiveDetail.unitValue * storageNetCost, 2);
      }

      case INCENTIVE_APPLIES_TO_VALUE.SOLAR_AND_STORAGE: {
        const storageNetCost = quoteCostBuildup.storageQuoteDetails.reduce(
          (accu, item) =>
            (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
          0,
        );
        const solarNetCost = quoteCostBuildup.panelQuoteDetails.reduce(
          (accu, item) =>
            (accu += this.calculateNetCostData(item.cost, item.discountDetails?.[0]?.amount, item.markup)),
          0,
        );
        return roundNumber(incentiveDetail.unitValue * (storageNetCost + solarNetCost), 2);
      }

      default:
        throw new Error(`Wrong appliesTo: ${appliesTo} `);
    }
  }

  handleUpdateQuoteFinanceProduct = (
    quoteFinanceProduct: QuoteFinanceProductDto,
    quoteCostBuildup: QuoteCostBuildupDto,
  ) => {
    const { incentiveDetails, projectDiscountDetails, rebateDetails } = quoteFinanceProduct;

    const newQuoteFinanceProduct = { ...quoteFinanceProduct };
    const incentiveAmount = incentiveDetails.reduce((accu, item) => {
      return (accu += this.calculateIncentiveValueAmount(item, quoteCostBuildup));
    }, 0);

    const rebateAmount = rebateDetails.reduce((accu, item) => {
      return (accu += item.amount);
    }, 0);

    const projectDiscountAmount = projectDiscountDetails.reduce((accu, item) => {
      if (item.unit === PROJECT_DISCOUNT_UNITS.AMOUNT) return (accu += item.unitValue);
      return (accu += roundNumber(item.unitValue * quoteCostBuildup.grossAmount, 2));
    }, 0);

    newQuoteFinanceProduct.netAmount = roundNumber(
      quoteCostBuildup.grossAmount - incentiveAmount - rebateAmount - projectDiscountAmount,
      2,
    );
    newQuoteFinanceProduct.financeProduct.productAttribute = this.handleUpdateProductAttribute(newQuoteFinanceProduct);

    return newQuoteFinanceProduct;
  };

  handleUpdateProductAttribute = (quoteFinanceProduct: QuoteFinanceProductDto) => {
    const { financeProduct, netAmount } = quoteFinanceProduct;

    switch (financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.CASH: {
        const newProductAttribute = { ...financeProduct.productAttribute } as any;
        newProductAttribute.balance = netAmount - newProductAttribute.upfrontPayment;
        newProductAttribute.milestonePayment = newProductAttribute.milestonePayment.map(item => ({
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
  };

  async countByOpportunityId(opportunityId: string): Promise<number> {
    return await this.quoteModel.countDocuments({ opportunity_id: opportunityId }).exec();
  }
}
