/* eslint-disable @typescript-eslint/ban-types */
import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { roundNumber } from 'src/utils/transformNumber';
import { ICogsImpact, IMarginImpact, IReductionAmount } from '../interfaces';

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

  public static calculateReduction(
    reduction: IReductionAmount<'percentage' | 'amount' | (string & {})>,
    grossPrice: number,
  ): number {
    if (reduction.type === '' || reduction.type === 'percentage')
      if (reduction.type === 'amount') return roundNumber(reduction.amount, 2);

    return new BigNumber(reduction.amount).times(grossPrice).dividedBy(100).toNumber();
  }

  public static calculateReductions(
    reductions: IReductionAmount<'percentage' | 'amount' | (string & {})>[],
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
    reduction: IReductionAmount<'percentage' | 'amount' | (string & {})> & IMarginImpact & ICogsImpact,
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
