import { sum } from 'lodash';
import { TemplateDataBuilder } from 'src/docusign-communications/typing';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';

export const getPaymentScheduleX10: TemplateDataBuilder = genericObject => {
  const { quote, leaseSolverConfig } = genericObject;
  const result: Record<string, string> = {};

  result.avg_solar_rate_per_kwh_year_1 = (quote.system_production.annual_usageKWh / 12).toFixed(2);

  const leaseAttribute =
    quote.quote_finance_product.finance_product.product_type === 'lease'
      ? (quote.quote_finance_product.finance_product.product_attribute as ILeaseProductAttributes)
      : undefined;

  const term = leaseAttribute?.lease_term ?? 0;

  const esclatorRate = leaseAttribute?.rate_escalator ?? 0;

  result.storage_monthly_payment = `${leaseSolverConfig?.storage_payment || 0}`;

  result.ESA_ESC = `${esclatorRate}`;

  const initMonth = leaseAttribute?.yearly_lease_payment_details[0].monthly_payment_details[0].month || 0;

  const leanYearlyPayments = leaseAttribute
    ? leaseAttribute.yearly_lease_payment_details.reduce<number[][]>((acc, cur, idx, arr) => {
        const curYear = cur.monthly_payment_details.filter(e => e.month >= initMonth).map(e => e.payment_amount);
        const nextYear = arr[idx + 1]
          ? arr[idx + 1].monthly_payment_details.filter(e => e.month < initMonth).map(e => e.payment_amount)
          : [];

        acc.push([...curYear, ...nextYear]);
        return acc;
      }, [])
    : [];

  // Temporarily using fixed value
  const annualDiscountRate = 0.03;

  [...Array(term)].forEach((_, idx) => {
    const yearIdx = idx + 1;

    result[`ESA_PMT${yearIdx}`] = `${
      leaseAttribute?.yearly_lease_payment_details[idx].monthly_payment_details[0] ?? 0
    }`;

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
};
