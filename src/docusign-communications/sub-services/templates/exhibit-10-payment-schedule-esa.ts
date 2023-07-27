/* eslint-disable no-restricted-properties */
import BigNumber from 'bignumber.js';
import { IGenericObject } from 'src/docusign-communications/typing';
import { FINANCE_PRODUCT_TYPE } from 'src/quotes/constants';
import { IEsaProductAttributes } from 'src/quotes/quote.schema';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { Number2DecimalsFormatter } from 'src/utils/numberFormatter';

@DocusignTemplate('demo', 'd7758c3f-82bc-4d7d-93f2-2c939c661f18')
@DocusignTemplate('live', '6e506965-14c4-4d82-a651-a2b608b1ea4f')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class Exhibit10PaymentScheduleEsaTemplate {
  @TabDynamic<IGenericObject>(genericObject => {
    const { quote } = genericObject;
    const result: Record<string, string> = {};
    const DEGRADATION_RATE = 0.005;
    const BUYOUT_DISCOUNT = 0.03;
    const DEFAULT_ESA_TERM = 25;

    const yearOneProduction = quote.systemProduction.generationKWh;

    const esaAttribute =
      quote.quoteFinanceProduct.financeProduct.productType === FINANCE_PRODUCT_TYPE.ESA
        ? (quote.quoteFinanceProduct.financeProduct.productAttribute as IEsaProductAttributes)
        : undefined;

    const escalatorRate = esaAttribute?.rateEscalator ?? 0;
    result.esa_escalator = `${escalatorRate}`;

    const term = esaAttribute?.esaTerm ?? 0;

    const monthlyPayment = esaAttribute?.grossFinancePayment ?? 0;
    const basePricePerkWhRate = new BigNumber(yearOneProduction ? (monthlyPayment * 12) / yearOneProduction : 0)
      .decimalPlaces(2)
      .toNumber();
    result.price_per_kwh = Number2DecimalsFormatter.format(basePricePerkWhRate);

    const NPV = (cashflow: number[], discountRate: number): number =>
      cashflow.reduce((acc, val, i) => acc + val / Math.pow(1 + discountRate, i), 0);

    const getCashflow = (originalArray: number[]): number[] => {
      const cashflow: number[] = [];

      originalArray.forEach(value => {
        cashflow.push(...Array.from({ length: 12 }, () => value));
      });

      return cashflow;
    };

    const estimatedMonthlyPaymentList: number[] = [];

    [...Array(DEFAULT_ESA_TERM)].forEach((_, idx) => {
      const yearIdx = idx + 1;

      if (yearIdx > term && term < DEFAULT_ESA_TERM) {
        estimatedMonthlyPaymentList.push(0);
        result[`payment_year${yearIdx}`] = '$0.00';
        return;
      }

      const estimatedProduction = yearOneProduction * Math.pow(1 - DEGRADATION_RATE, yearIdx - 1);
      const pricePerkWhRate = basePricePerkWhRate * Math.pow(1 + new BigNumber(escalatorRate).dividedBy(100).toNumber(), yearIdx - 1);

      const estimatedMonthlyPayment = (estimatedProduction * pricePerkWhRate) / 12;

      estimatedMonthlyPaymentList.push(estimatedMonthlyPayment);

      result[`payment_year${yearIdx}`] = `$${Number2DecimalsFormatter.format(estimatedMonthlyPayment)}`;
    });

    estimatedMonthlyPaymentList.forEach((_, index) => {
      const yearIdx = index + 1;

      if (yearIdx < 6) {
        return;
      }

      if (yearIdx > term && term < DEFAULT_ESA_TERM) {
        result[`payoff_year_${yearIdx}`] = '$0.00';
        return;
      }

      result[`payoff_year_${yearIdx}`] = `$${Number2DecimalsFormatter.format(
        NPV(getCashflow(estimatedMonthlyPaymentList.slice(index, term)), BUYOUT_DISCOUNT / 12),
      )}`;
    });

    return result;
  })
  dynamicTabs: unknown;
}
