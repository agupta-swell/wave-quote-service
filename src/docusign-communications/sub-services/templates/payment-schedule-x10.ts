import { sum } from 'lodash';
import { IGenericObject } from 'src/docusign-communications/typing';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DocusignTemplate('demo', 'd7758c3f-82bc-4d7d-93f2-2c939c661f18')
export class PaymentScheduleX10Template {
  @TabDynamic<IGenericObject>(genericObject => {
    const { quote, leaseSolverConfig } = genericObject;
    const result: Record<string, string> = {};

    result.avg_solar_rate_per_kwh_year_1 = (quote.systemProduction.annualUsageKWh / 12).toFixed(2);

    const leaseAttribute =
      quote.quoteFinanceProduct.financeProduct.productType === 'lease'
        ? (quote.quoteFinanceProduct.financeProduct.productAttribute as ILeaseProductAttributes)
        : undefined;

    const term = leaseAttribute?.leaseTerm ?? 0;

    const esclatorRate = leaseAttribute?.rateEscalator ?? 0;

    result.storage_monthly_payment = `${leaseSolverConfig?.storagePayment || 0}`;

    result.ESA_ESC = `${esclatorRate}`;

    const initMonth = leaseAttribute?.yearlyLeasePaymentDetails[0].monthlyPaymentDetails[0].month || 0;

    const leanYearlyPayments = leaseAttribute
      ? leaseAttribute.yearlyLeasePaymentDetails.reduce<number[][]>((acc, cur, idx, arr) => {
          const curYear = cur.monthlyPaymentDetails.filter(e => e.month >= initMonth).map(e => e.paymentAmount);
          const nextYear = arr[idx + 1]
            ? arr[idx + 1].monthlyPaymentDetails.filter(e => e.month < initMonth).map(e => e.paymentAmount)
            : [];

          acc.push([...curYear, ...nextYear]);
          return acc;
        }, [])
      : [];

    // Temporarily using fixed value
    const annualDiscountRate = 0.03;

    [...Array(term)].forEach((_, idx) => {
      const yearIdx = idx + 1;

      result[`ESA_PMT${yearIdx}`] = `${leaseAttribute?.yearlyLeasePaymentDetails[idx].monthlyPaymentDetails[0] ?? 0}`;

      if (idx > 5) {
        result[`Yr${yearIdx}_Payoff`] = `${leanYearlyPayments.reduce<number>((acc, cur, id) => {
          if (id > idx) {
            acc += sum(cur.map((v, j) => v / (1 + annualDiscountRate / 12) ** j));
          }

          return acc;
        }, 0)}`;
      }
    });
    return result;
  })
  dynamicTabs: unknown;
}
