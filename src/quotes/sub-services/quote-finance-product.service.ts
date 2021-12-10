import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';
import { PROMOTION_TYPE } from 'src/promotions/promotion.constant';
import { ICalculateQuoteFinanceProductNetAmountArg, IReductionAmount } from '../interfaces';

@Injectable()
export class QuoteFinanceProductService {
  private calculateTotalAmount(...products: IReductionAmount<unknown>[]): number {
    return (
      products
        .reduce((total, product) => {
          total = total.plus(product.amount);

          return total;
        }, new BigNumber(0))
        .toNumber() ?? 0
    );
  }

  /**
   * @return [totalPercentage, totalAmount]
   */
  public calculateReduction(financeProduct: ICalculateQuoteFinanceProductNetAmountArg): [number, number] {
    // TODO: rebate?
    const {
      incentiveDetails = [],
      projectDiscountDetails = [],
      // rebateDetails = [],
      promotionDetails = [],
    } = financeProduct;

    const totalPercentage = this.calculateTotalAmount(
      ...projectDiscountDetails.filter(e => e.type === DISCOUNT_TYPE.PERCENTAGE),
      ...promotionDetails.filter(e => e.type === PROMOTION_TYPE.PERCENTAGE),
    );

    const totalAmount = this.calculateTotalAmount(
      ...incentiveDetails,
      // ...rebateDetails,
      ...projectDiscountDetails.filter(e => e.type === DISCOUNT_TYPE.AMOUNT),
      ...promotionDetails.filter(e => e.type === PROMOTION_TYPE.AMOUNT),
    );

    return [totalPercentage, totalAmount];
  }

  public calculateNetAmount(
    grossPrice: number,
    totalPercentageReduction: number,
    totalAmountReduction: number,
  ): number {
    return new BigNumber(100)
      .minus(totalPercentageReduction)
      .times(grossPrice)
      .dividedBy(100)
      .minus(totalAmountReduction)
      .toNumber();
  }
}