import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { BigNumber } from 'bignumber.js';
import { IDetailedQuoteSchema } from 'src/quotes/quote.schema';
import { QuoteCostBuildUpService, QuoteFinanceProductService } from 'src/quotes/sub-services';
import { roundNumber } from 'src/utils/transformNumber';
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
    quote: IDetailedQuoteSchema,
  ): Promise<CustomerPayment> {
    const customerPayment = new this.customerPaymentModel();

    const { quoteCostBuildup, quoteFinanceProduct } = quote;

    customerPayment.opportunityId = opportunityId;
    customerPayment.wqtContractId = contractId.toString();

    customerPayment.netAmount = quoteCostBuildup.projectGrandTotal.netCost;

    customerPayment.rebate = QuoteFinanceProductService.calculateReductions(
      quoteFinanceProduct.rebateDetails,
      quoteCostBuildup.projectGrossTotal.netCost,
    );

    const [
      totalCreditPercentageReduction,
      totalCreditAmountReduction,
    ] = this.quoteFinanceProductService.calculateReduction({
      ...quoteFinanceProduct,
      promotionDetails: [],
    });

    customerPayment.credit = new BigNumber(
      this.quoteCostBuildupService.calculateTotalPromotionsDiscountsAndSwellGridrewards(
        quoteCostBuildup.projectGrossTotal,
        totalCreditAmountReduction,
        totalCreditPercentageReduction,
      ).total,
    )
      .plus(quoteCostBuildup.cashDiscount.total)
      .toNumber();

    customerPayment.programIncentiveDiscount = QuoteFinanceProductService.calculateReductions(
      quoteFinanceProduct.promotionDetails,
      quoteCostBuildup.projectGrossTotal.netCost,
    );

    const [totalPercentageReduction, totalAmountReduction] = this.quoteFinanceProductService.calculateReduction(
      quoteFinanceProduct,
    );

    const reductionsAmount = this.quoteCostBuildupService.calculateTotalPromotionsDiscountsAndSwellGridrewards(
      quoteCostBuildup.projectGrossTotal,
      totalAmountReduction,
      totalPercentageReduction,
    );

    customerPayment.amount = new BigNumber(quoteCostBuildup.projectGrandTotal.netCost)
      .plus(reductionsAmount.total)
      .plus(quoteCostBuildup.cashDiscount.total)
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
