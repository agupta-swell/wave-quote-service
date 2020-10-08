import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, pickBy, sumBy } from 'lodash';
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
import { CreateQuoteDto } from './req/create-quote.dto';
import { UpdateQuoteDto } from './req/update-quote.dto';
import { QuoteDto } from './res/quote.dto';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(QUOTE) private readonly quoteModel: Model<Quote>,
    private readonly systemDesignService: SystemDesignService,
    private readonly utilityProgramService: UtilityProgramService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly cashPaymentConfigService: CashPaymentConfigService,
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

    const utilityProgram = await this.utilityProgramService.getFirst();
    const fundingSource = await this.fundingSourceService.getDetail(data.fundingSourceId);

    const detailedQuote = {
      systemProduction: systemDesign.system_production_data,
      quoteCostBuildup,
      utilityProgram: {
        utilityProgramId: utilityProgram?.id,
        utilityProgramName: utilityProgram?.name,
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

    const createdQuote = new this.quoteModel(model);
    await createdQuote.save();

    return OperationResult.ok(new QuoteDto(createdQuote.toObject())) as any;
  }

  async createProductAttribute(productType: string, netAmount) {
    let template = {};
    switch (productType) {
      case FINANCE_PRODUCT_TYPE.LOAN:
        template = {
          upfrontPayment: 0,
          loanAmount: 0,
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
          leaseAmount: 0,
          leaseTerm: 0,
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
      utilityProgram: foundQuote.detailed_quote.utility_program,
      systemProduction: foundQuote.detailed_quote.system_production,
      quoteName: data.quoteName || foundQuote.detailed_quote.quote_name,
      isSelected: data.isSelected || foundQuote.detailed_quote.is_selected,
      isSolar: foundQuote.detailed_quote.is_solar,
      isRetrofit: foundQuote.detailed_quote.is_retrofit,
    };

    const model = new QuoteModel(data, detailedQuote);

    const removedUndefined = pickBy(model, item => typeof item !== 'undefined');
    const savedQuote = await this.quoteModel.findByIdAndUpdate(quoteId, removedUndefined, { new: true });
    return OperationResult.ok(new QuoteDto({ ...savedQuote.toObject() }));
  }

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
