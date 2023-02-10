import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BigNumber } from 'bignumber.js';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { IDetailedQuoteSchema } from 'src/quotes/quote.schema';
import { QuoteCostBuildUpService, QuoteFinanceProductService } from 'src/quotes/sub-services';
import { BigNumberUtils } from 'src/utils';
import { roundNumber } from 'src/utils/transformNumber';
import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';
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

  async calculateContractCustomPayment(
    contractId: string | ObjectId,
    opportunityId: string,
    detailedQuote: IDetailedQuoteSchema,
  ): Promise<CustomerPayment> {
    const latestCustomerPayment = await this.customerPaymentModel
      .find({ opportunityId })
      .limit(1)
      .sort({ modifiedAt: -1 })
      .lean();

    const customerPayment = new this.customerPaymentModel();

    const { actualDepositMade = 0, actualPayment1Made = 0 } = latestCustomerPayment[0] || {};

    const now = new Date();

    if (latestCustomerPayment.length) {
      delete latestCustomerPayment[0]._id;
      delete latestCustomerPayment[0].__v;
      latestCustomerPayment[0].createdAt = now;
      latestCustomerPayment[0].updatedAt = now;
      const latestCustomerPaymentKeys = Object.keys(latestCustomerPayment[0]);
      latestCustomerPaymentKeys.forEach(key => {
        customerPayment[key] = latestCustomerPayment[0][key];
      });
    }

    const { quoteCostBuildup, quoteFinanceProduct } = detailedQuote;

    customerPayment.opportunityId = opportunityId;
    customerPayment.wqtContractId = contractId.toString();

    customerPayment.netAmount = quoteCostBuildup.projectGrandTotal.netCost;

    customerPayment.rebate = BigNumberUtils.sumBy(quoteFinanceProduct.rebateDetails, 'amount').toNumber();

    customerPayment.credit = quoteFinanceProduct.projectDiscountDetails
      .reduce((acc, cur) => {
        const discountAmount = new BigNumber(cur?.amount || 0);
        return acc.plus(
          cur.type === DISCOUNT_TYPE.PERCENTAGE
            ? discountAmount.dividedBy(100).multipliedBy(quoteCostBuildup.projectGrossTotal?.netCost || 0)
            : discountAmount,
        );
      }, new BigNumber(0))
      .plus(quoteCostBuildup.cashDiscount?.total || 0)
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

      customerPayment.actualDepositMade = actualDepositMade || 0;
      // if customer paid the deposit
      customerPayment.deposit = actualDepositMade || deposit;

      customerPayment.payment1 =
        actualPayment1Made ||
        roundNumber(
          Math.min(
            new BigNumber(quoteCostBuildup.projectGrandTotal.netCost).minus(customerPayment.deposit).toNumber(),
            milestonePayment1Value,
          ),
          2,
        );

      customerPayment.payment2 = roundNumber(
        new BigNumber(quoteCostBuildup.projectGrandTotal.netCost)
          .minus(customerPayment.deposit)
          .minus(customerPayment.payment1)
          .toNumber(),
        2,
      );
    } else {
      customerPayment.deposit = 0;
      customerPayment.payment1 = 0;
      customerPayment.payment2 = quoteCostBuildup.projectGrandTotal.netCost;
    }

    return customerPayment;
  }

  async create(
    contractId: string | ObjectId,
    opportunityId: string,
    detailedQuote: IDetailedQuoteSchema,
  ): Promise<CustomerPayment> {
    const customerPayment = await this.calculateContractCustomPayment(contractId, opportunityId, detailedQuote);

    await customerPayment.save();

    return customerPayment;
  }
}
