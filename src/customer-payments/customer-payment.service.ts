import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { BigNumber } from 'bignumber.js';
import { IDetailedQuoteSchema } from 'src/quotes/quote.schema';
import { QuoteCostBuildUpService, QuoteFinanceProductService } from 'src/quotes/sub-services';
import { roundNumber } from 'src/utils/transformNumber';
import { BigNumberUtils } from 'src/utils';
import { CustomerPayment, CUSTOMER_PAYMENT } from './customer-payment.schema';

@Injectable()
export class CustomerPaymentService {
  constructor(
    @InjectModel(CUSTOMER_PAYMENT) private customerPaymentModel: Model<CustomerPayment>,
    @Inject(forwardRef(() => QuoteFinanceProductService))
    private readonly quoteFinanceProductService: QuoteFinanceProductService,
    @Inject(forwardRef(() => QuoteCostBuildUpService))
    private readonly quoteCostBuildupService: QuoteCostBuildUpService,
  ) {}

  // =====================> INTERNAL <=====================

  async getCustomerPaymentByOpportunityId(opportunityId: string): Promise<LeanDocument<CustomerPayment> | null> {
    const res = await this.customerPaymentModel.findOne({ opportunityId }).lean();
    return res;
  }

  async getCustomerPaymentByContractId(wqtContractId: string): Promise<LeanDocument<CustomerPayment> | null> {
    const res = await this.customerPaymentModel.findOne({ wqtContractId }).lean();
    return res;
  }

  async create(
    contractId: string | ObjectId,
    opportunityId: string,
    detailedQuote: IDetailedQuoteSchema,
  ): Promise<CustomerPayment> {
    const customerPayment = new this.customerPaymentModel();

    const { quoteCostBuildup, quoteFinanceProduct } = detailedQuote;

    customerPayment.opportunityId = opportunityId;
    customerPayment.wqtContractId = contractId.toString();

    customerPayment.netAmount = quoteCostBuildup.projectGrandTotal.netCost;

    customerPayment.rebate = BigNumberUtils.sumBy(quoteFinanceProduct.rebateDetails, 'amount').toNumber();

    customerPayment.credit = BigNumberUtils.sumBy(quoteFinanceProduct.projectDiscountDetails, 'amount')
      .plus(BigNumberUtils.sumBy(quoteFinanceProduct.incentiveDetails, 'amount'))
      .plus(quoteCostBuildup.cashDiscount.total)
      .toNumber();

    customerPayment.programIncentiveDiscount = BigNumberUtils.sumBy(
      quoteFinanceProduct.promotionDetails,
      'amount',
    ).toNumber();

    customerPayment.amount = new BigNumber(customerPayment.netAmount)
      .plus(customerPayment.credit)
      .plus(customerPayment.programIncentiveDiscount)
      .toNumber();

    customerPayment.adjustment = 0;

    if (quoteFinanceProduct.financeProduct.productType === 'cash') {
      const deposit = quoteFinanceProduct.financeProduct.productAttribute.upfrontPayment;

      let milestonePayment1Value = quoteFinanceProduct.financeProduct.financialProductSnapshot.payment1 ?? 0;

      if (quoteFinanceProduct.financeProduct.financialProductSnapshot.payment1PayPercent) {
        milestonePayment1Value = new BigNumber(quoteCostBuildup.projectGrandTotal.netCost)
          .multipliedBy(milestonePayment1Value)
          .div(100)
          .toNumber();
      }

      customerPayment.deposit = deposit;

      customerPayment.payment1 = roundNumber(
        Math.min(
          new BigNumber(quoteCostBuildup.projectGrandTotal.netCost).minus(deposit).toNumber(),
          milestonePayment1Value,
        ),
        2,
      );

      customerPayment.payment2 = roundNumber(
        new BigNumber(quoteCostBuildup.projectGrandTotal.netCost)
          .minus(deposit)
          .minus(customerPayment.payment1)
          .toNumber(),
        2,
      );
    } else {
      customerPayment.deposit = 0;
      customerPayment.payment1 = 0;
      customerPayment.payment2 = quoteCostBuildup.projectGrandTotal.netCost;
    }

    await customerPayment.save();

    return customerPayment;
  }
}
