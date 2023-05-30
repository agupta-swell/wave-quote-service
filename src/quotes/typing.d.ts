import { ELaborCostType } from './constants';
import { ILaborCostSchema } from './quote.schema';

export interface IGetPaymentAmount {
  loanAmount: number;
  annualInterestRate: number;
  periodStart: number;
}

export interface IGenLoanDataParam {
  loanAmount: number;
  annualInterestRate: number;
  loanStartDate: Date;
  totalPeriod: number;
  amountOfPrePayment: number;
  monthOfPrePayment: number;
  periodWhenPrinciplePaymentStarts: number;
}

export interface IPayPeriodData {
  paymentDueDate: string;
  daysInPeriod: number;
  daysInYear: number;
  period: number;
  paymentNumber: number;
  startingBalance: number;
  monthlyPayment: number;
  interestComponent: number;
  principleComponent: number;
  endingBalance: number;
  prePaymentAmount: number;
  unpaidInterest: number;
  unpaidInterestCumulative: number;
  adjustedMonthlyPayment: number;
}

export interface ILaborCost extends Omit<ILaborCostSchema, 'laborCostType'> {
  laborCostType: string | ELaborCostType;
}

export interface ICreateProductAttribute {
  productType: string;
  netAmount: number;
  financialProductSnapshot: LeanDocument<FinancialProduct>;
  currentPricePerKWh: number;
  newPricePerKWh: number;
  currentAverageMonthlyBill: number;
  newAverageMonthlyBill: number;
  capacityKW: number;
  esaTerm?: number;
  rateEscalator?: number;
}