import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, pick, pickBy, sumBy } from 'lodash';
import { Model } from 'mongoose';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { UtilityProgramService } from 'src/utility-programs/utility-program.service';
import { roundNumber } from 'src/utils/transformNumber';
import { ApplicationException } from './../app/app.exception';
import { OperationResult, Pagination } from './../app/common';
import { CashPaymentConfigService } from './../cash-payment-configs/cash-payment-config.service';
import { SystemDesignService } from './../system-designs/system-design.service';
import { FINANCE_PRODUCT_TYPE } from './constants';
import { Quote, QUOTE, QuoteModel } from './quote.schema';
import { CalculateQuoteDetailDto, CreateQuoteDto, UpdateQuoteDto } from './req';
import { LoanProductAttributesDto } from './req/sub-dto';
import { QuoteDto } from './res/quote.dto';
import { CalculationService } from './sub-services/calculation.service';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(QUOTE) private readonly quoteModel: Model<Quote>,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly utilityProgramService: UtilityProgramService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly cashPaymentConfigService: CashPaymentConfigService,
    private readonly calculationService: CalculationService,
  ) {}

  async createQuote(data: CreateQuoteDto, quoteId?: string): Promise<OperationResult<QuoteDto>> {
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
          interestRate: 0,
          loanTerm: 0,
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
      panel_quote_details,
      inverter_quote_details,
      storage_quote_details,
      adder_quote_details,
    } = foundQuote.detailed_quote.quote_cost_buildup;

    const oldPanels = panel_quote_details.reduce((acc, item) => ({ [item.panel_model_id]: item }), {});
    const oldInverters = inverter_quote_details.reduce((acc, item) => ({ [item.inverter_model_id]: item }), {});
    const oldStorage = storage_quote_details.reduce((acc, item) => ({ [item.storage_model_id]: item }), {});
    const oldAdders = adder_quote_details.reduce((acc, item) => ({ [item.adder_model_id]: item }), {});

    const quoteCostBuildup = {
      panelQuoteDetails: this.groupData(
        systemDesign.roof_top_design_data.panel_array.map(item => ({
          panelModelId: item.panel_model_id,
          panelModelDataSnapshot: item.panel_model_data_snapshot,
          panelModelSnapshotDate: new Date(),
          quantity: item.number_of_panels,
          ...quoteCostCommon,
          ...pick(oldPanels[item.panel_model_id], ['markup', 'discount_details', 'net_cost']),
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
          ...pick(oldInverters[item.inverter_model_id], ['markup', 'discount_details', 'net_cost']),
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
          ...pick(oldStorage[item.storage_model_id], ['markup', 'discount_details', 'net_cost']),
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
          ...pick(oldAdders[item.adder_id], ['markup', 'discount_details', 'net_cost']),
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
      savingsDetails: [],
      quoteName: '',
      isSelected: false,
      isSolar: systemDesign.is_solar,
      isRetrofit: systemDesign.is_retrofit,
    };

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

    const detailedQuote = {
      ...data,
      systemProduction: foundQuote.detailed_quote.system_production,
      quoteName: data.quoteName || foundQuote.detailed_quote.quote_name,
      isSelected: data.isSelected || foundQuote.detailed_quote.is_selected,
      isSolar: foundQuote.detailed_quote.is_solar,
      isRetrofit: foundQuote.detailed_quote.is_retrofit,
    };

    const model = new QuoteModel(data, detailedQuote);
    model.setIsSync(data.isSync);

    const removedUndefined = pickBy(model, item => typeof item !== 'undefined');
    const savedQuote = await this.quoteModel.findByIdAndUpdate(quoteId, removedUndefined, { new: true });
    return OperationResult.ok(new QuoteDto({ ...savedQuote.toObject() }));
  }

  async calculateQuoteDetail(data: CalculateQuoteDetailDto): Promise<OperationResult<QuoteDto>> {
    let res: CalculateQuoteDetailDto;
    switch (data.quoteFinanceProduct.financeProduct.productType) {
      case FINANCE_PRODUCT_TYPE.LEASE:
        res = await this.calculationService.calculateLeaseQuote(data);
        break;
      case FINANCE_PRODUCT_TYPE.LEASE:
        const {
          quoteFinanceProduct: {
            financeProduct: { productAttribute },
          },
        } = data;

        const product = productAttribute as LoanProductAttributesDto;

        res = this.calculationService.calculateLoanSolver(
          product.interestRate,
          product.loanAmount,
          new Date(),
          product.loanTerm,
          18,
          product.upfrontPayment,
          18,
          0.01,
        ) as any;
        break;
      case FINANCE_PRODUCT_TYPE.LEASE:
        res = {} as any;
        break;
      default:
        break;
    }
    return OperationResult.ok(res as any);
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

    return adderNetCost + storageNetCost + inverterNetCost + panelNetCost;
  }
}
