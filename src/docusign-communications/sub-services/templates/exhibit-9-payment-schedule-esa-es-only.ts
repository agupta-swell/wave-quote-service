/* eslint-disable no-restricted-properties */
import BigNumber from 'bignumber.js';
import { IGenericObject } from 'src/docusign-communications/typing';
import { FINANCE_PRODUCT_TYPE } from 'src/quotes/constants';
import { IEsaProductAttributes } from 'src/quotes/quote.schema';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { Number2DecimalsFormatter } from 'src/utils/numberFormatter';

@DocusignTemplate('demo', '94df351f-f51f-43be-a608-9d18911fcb19')
@DocusignTemplate('live', 'f5adc559-59c3-48c3-b94a-a21ee9368a1c')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class Exhibit9PaymentScheduleEsaTemplate {
  @TabDynamic<IGenericObject>(genericObject => {
    const { quote } = genericObject;
    const result: Record<string, string> = {};
    const BUYOUT_DISCOUNT = 0.03;
    const DEFAULT_ESA_TERM = 25;

    const esaAttribute =
      quote.quoteFinanceProduct.financeProduct.productType === FINANCE_PRODUCT_TYPE.ESA
        ? (quote.quoteFinanceProduct.financeProduct.productAttribute as IEsaProductAttributes)
        : undefined;

    const escalatorRate = esaAttribute?.rateEscalator ?? 0;
    result.esa_escalator = `${escalatorRate}`;

    const term = esaAttribute?.esaTerm ?? 0;

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
    const estimatedMonthlyPaymentYearOne = esaAttribute?.grossFinancePayment ?? 0;

    [...Array(DEFAULT_ESA_TERM)].forEach((_, idx) => {
      const yearIdx = idx + 1;

      if (yearIdx > term && term < DEFAULT_ESA_TERM) {
        estimatedMonthlyPaymentList.push(0);
        result[`payment_year${yearIdx}`] = '$0.00';
        return;
      }

      const estimatedMonthlyPayment =
        estimatedMonthlyPaymentYearOne *
        Math.pow(1 + new BigNumber(escalatorRate).dividedBy(100).toNumber(), yearIdx - 1);

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
