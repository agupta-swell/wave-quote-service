import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';
import { PROMOTION_TYPE } from 'src/promotions/promotion.constant';
import { roundNumber } from 'src/utils/transformNumber';
import { REBATE_TYPE } from '../constants';
import { ICalculateQuoteFinanceProductNetAmountArg, ICogsImpact, IMarginImpact, IReductionAmount } from '../interfaces';

@Injectable()
export class QuoteFinanceProductService {
  private calculateTotalAmount(roundNum: boolean, ...products: IReductionAmount<unknown>[]): number {
    const amount =
      products
        .reduce((total, product) => {
          total = total.plus(product.amount);

          return total;
        }, new BigNumber(0))
        .toNumber() ?? 0;

    if (!roundNum) return amount;
    return roundNumber(amount, 2);
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
      false,
      ...projectDiscountDetails.filter(e => e.type === DISCOUNT_TYPE.PERCENTAGE),
      ...promotionDetails.filter(e => e.type === PROMOTION_TYPE.PERCENTAGE),
    );

    const totalAmount = this.calculateTotalAmount(
      true,
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
    const amount = new BigNumber(100)
      .minus(totalPercentageReduction)
      .times(grossPrice)
      .dividedBy(100)
      .minus(totalAmountReduction)
      .toNumber();

    return roundNumber(amount, 2);
  }

  public static calculateReduction(
    reduction: IReductionAmount<'percentage' | 'amount' | REBATE_TYPE>,
    grossPrice: number,
  ): number {
    if (reduction.type === 'percentage')
      return new BigNumber(reduction.amount).times(grossPrice).dividedBy(100).toNumber();

    return roundNumber(reduction.amount, 2);
  }

  public static calculateReductions(
    reductions: IReductionAmount<'percentage' | 'amount' | REBATE_TYPE>[],
    grossPrice: number,
  ): number {
    const total = reductions
      .reduce((total, reduction) => {
        if (reduction.type === 'percentage')
          return total.plus(new BigNumber(reduction.amount).times(grossPrice).dividedBy(100));

        return total.plus(reduction.amount);
      }, new BigNumber(0))
      .toNumber();

    return roundNumber(total, 2);
  }

  public static attachImpact(
    reduction: IReductionAmount<'percentage' | 'amount' | REBATE_TYPE> & IMarginImpact & ICogsImpact,
    grossPrice: number,
  ) {
    const amount = QuoteFinanceProductService.calculateReduction(reduction, grossPrice);

    if (reduction.cogsAllocation === undefined) {
      reduction.cogsAllocation = 0;
    }

    if (reduction.marginAllocation === undefined) {
      reduction.marginAllocation = 100;
    }

    reduction.cogsAmount = roundNumber(
      new BigNumber(amount).multipliedBy(reduction.cogsAllocation).dividedBy(100).toNumber(),
      2,
    );
    reduction.marginAmount = roundNumber(
      new BigNumber(amount).multipliedBy(reduction.marginAllocation).dividedBy(100).toNumber(),
      2,
    );
  }
}
