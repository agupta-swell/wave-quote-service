import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BigNumber } from 'bignumber.js';
import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';
import { FilterQuery, LeanDocument, Model, ObjectId, Types } from 'mongoose';

import { IDetailedQuoteSchema } from 'src/quotes/quote.schema';
import { QuoteCostBuildUpService, QuoteFinanceProductService } from 'src/quotes/sub-services';
import { BigNumberUtils } from 'src/utils';
import { roundNumber } from 'src/utils/transformNumber';
import { CONTRACT_TYPE, PROCESS_STATUS } from 'src/contracts/constants';
import { Contract, CONTRACT } from 'src/contracts/contract.schema';
import { CUSTOMER_PAYMENT, CustomerPayment } from './customer-payment.schema';

@Injectable()
export class CustomerPaymentService {
  constructor(
    @InjectModel(CUSTOMER_PAYMENT) private customerPaymentModel: Model<CustomerPayment>,
    @InjectModel(CONTRACT) private contractModel: Model<Contract>,
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

  async getLatestCustomerPayment(contractId: string, opportunityId: string): Promise<LeanDocument<CustomerPayment>> {
    const filter: FilterQuery<Contract> = {
      opportunityId,
      contractType: { $ne: CONTRACT_TYPE.GRID_SERVICES_PACKET },
    };

    if (contractId) {
      filter._id = { $ne: Types.ObjectId(contractId) };
    }

    const previousContractList = await this.contractModel
      .find(filter)
      .select('_id')
      .sort({ createdAt: -1 })
      .lean();

    const previousWqtContract =
      previousContractList.find((item) => item.contractStatus === PROCESS_STATUS.COMPLETED) || previousContractList[0];

    const customerPaymentList = await this.customerPaymentModel
      .find({ opportunityId })
      .sort({ createdAt: -1 })
      .lean();

    return customerPaymentList.find((cp) => cp.wqtContractId === previousWqtContract?._id?.toString()) || customerPaymentList[0];
  } 

  async calculateContractCustomPayment(
    contractId: string | ObjectId,
    opportunityId: string,
    detailedQuote: IDetailedQuoteSchema,
  ): Promise<CustomerPayment> {
    const latestCustomerPayment = await this.getLatestCustomerPayment(contractId.toString(), opportunityId) || {};

    const customerPayment = new this.customerPaymentModel();

    const { actualDepositMade = 0, actualPayment1Made = 0 } = latestCustomerPayment;

    const now = new Date();

    delete latestCustomerPayment._id;
    delete latestCustomerPayment.__v;
    latestCustomerPayment.createdAt = now;
    latestCustomerPayment.updatedAt = now;

    const latestCustomerPaymentKeys = Object.keys(latestCustomerPayment);
    
    latestCustomerPaymentKeys.forEach(key => {
      customerPayment[key] = latestCustomerPayment[key];
    });

    const { quoteCostBuildup, quoteFinanceProduct } = detailedQuote;

    customerPayment.opportunityId = opportunityId;
    customerPayment.wqtContractId = contractId.toString();

    customerPayment.netAmount = quoteFinanceProduct.netAmount;

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
        milestonePayment1Value = new BigNumber(quoteFinanceProduct.netAmount)
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
            new BigNumber(quoteFinanceProduct.netAmount).minus(customerPayment.deposit).toNumber(),
            milestonePayment1Value,
          ),
          2,
        );

      customerPayment.payment2 = roundNumber(
        new BigNumber(quoteFinanceProduct.netAmount)
          .minus(customerPayment.deposit)
          .minus(customerPayment.payment1)
          .toNumber(),
        2,
      );
    } else {
      customerPayment.deposit = 0;
      customerPayment.payment1 = 0;
      customerPayment.payment2 = quoteFinanceProduct.netAmount;
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
