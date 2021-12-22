import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';
import { PROMOTION_TYPE } from 'src/promotions/promotion.constant';
import { REBATE_TYPE } from '../constants';
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

  public static calculateReduction(reduction: IReductionAmount<'percentage' | 'amount'>, grossPrice: number): number {
    if (reduction.type === 'percentage')
      return new BigNumber(reduction.amount).times(grossPrice).dividedBy(100).toNumber();

    return reduction.amount;
  }

  public static calculateReductions(
    reductions: IReductionAmount<'percentage' | 'amount' | REBATE_TYPE>[],
    grossPrice: number,
  ): number {
    return reductions
      .reduce((total, reduction) => {
        if (reduction.type === 'percentage')
          return total.plus(new BigNumber(reduction.amount).times(grossPrice).dividedBy(100));

        return total.plus(reduction.amount);
      }, new BigNumber(0))
      .toNumber();
  }
}
