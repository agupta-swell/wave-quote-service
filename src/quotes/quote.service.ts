import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy } from 'lodash';
import { Model } from 'mongoose';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { UtilityProgramService } from 'src/utility-programs/utility-program.service';
import { OperationResult } from './../app/common';
import { CashPaymentConfigService } from './../cash-payment-configs/cash-payment-config.service';
import { SystemDesignService } from './../system-designs/system-design.service';
import { FINANCE_PRODUCT_TYPE } from './constants';
import { Quote, QUOTE, QuoteModel } from './quote.schema';
import { CreateQuoteDto } from './req/create-quote.dto';
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
    };

    const quoteCostBuildup = {
      panelQuoteDetails: systemDesign.roof_top_design_data.panel_array.map(item => ({
        panelModelId: item.panel_model_id,
        panelModelDataSnapshot: item.panel_model_data_snapshot,
        panelModelSnapshotDate: new Date(),
        quantity: item.number_of_panels,
        ...quoteCostCommon,
        cost: item.number_of_panels * item.panel_model_data_snapshot.price,
      })),
      inverterQuoteDetails: systemDesign.roof_top_design_data.inverters.map(item => ({
        inverterModelId: item.inverter_model_id,
        inverterModelDataSnapshot: item.inverter_model_data_snapshot,
        inverterModelSnapshotDate: new Date(),
        ...quoteCostCommon,
        cost: item.quantity * item.inverter_model_data_snapshot.price,
      })),
      storageQuoteDetails: systemDesign.roof_top_design_data.storage.map(item => ({
        storageModelId: item.storage_model_id,
        storageModelDataSnapshot: item.storage_model_data_snapshot,
        storageModelSnapshotDate: new Date(),
        ...quoteCostCommon,
        cost: item.quantity * item.storage_model_data_snapshot.price,
      })),
      adderQuoteDetails: systemDesign.roof_top_design_data.adders.map(item => ({
        adderModelId: item.adder_id,
        adderModelDataSnapshot: item.adder_model_data_snapshot,
        adderModelSnapshotDate: new Date(),
        ...quoteCostCommon,
        cost: item.quantity * item.adder_model_data_snapshot.price,
      })),
      overallMarkup: 0,
      totalProductCost: 0,
      laborCost: {
        laborCostDataSnapshot: {
          calculationType: 'standard',
          unit: 'each',
        },
        laborCostSnapshotDate: new Date(),
        ...quoteCostCommon,
      },
      grossAmount: 0,
    };

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
          financeProduct: fundingSource.type,
          fundingSourceId: fundingSource.id,
          fundingSourceName: fundingSource.name,
          productAttribute: await this.createProductAttribute(fundingSource.type),
        },
        netAmount: 0,
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
    };

    // const quote = {
    //   opportunityId: data.opportunityId,
    //   systemDesignId: data.systemDesignId,
    //   quoteModelType: 'detailed',
    //   // detailedQuote,
    // };

    const model = new QuoteModel(data, detailedQuote);

    const createdQuote = new this.quoteModel(model);
    await createdQuote.save();

    return OperationResult.ok(new QuoteDto(createdQuote.toObject())) as any;
  }

  async createProductAttribute(productType: string) {
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
          balance: 0,
          milestonePayment: [],
          //TODO: need Son implement
          cashQuoteConfigSnapshot: cashQuoteConfig,
          cashQuoteConfigSnapShotDate: '',
          currentAverageMonthlyBill: 0,
          newAverageMonthlyBill: 0,
          currentPricePerKwh: 0,
          newPricePerKwh: 0,
        };
        return template;
    }
  }

  groupData(data: any[], field: string) {
    const groupById = groupBy(data, field);
  }
}
