import { toFixNumber } from './../../utils/transformNumber';
import { Injectable } from '@nestjs/common';
import { groupBy, sumBy } from 'lodash';
import { LeaseSolverConfigService } from '../../lease-solver-configs/lease-solver-config.service';
import { UtilityService } from '../../utilities/utility.service';
import { getDaysInYear } from '../../utils/datetime';
import { LeaseProductAttributesDto, LoanProductAttributesDto } from '../req/sub-dto';
import { IGenLoanDataParam, IGetPaymentAmount, IPayPeriodData } from '../typing.d';
import { ApplicationException } from './../../app/app.exception';
import { getDaysInMonth, getPaymentDueDateByPeriod } from './../../utils/datetime';
import { CalculateQuoteDetailDto } from './../req';

@Injectable()
export class CalculationService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
  ) {}

  async calculateLeaseQuote(
    detailedQuote: CalculateQuoteDetailDto,
    monthlyUtilityPayment: number,
  ): Promise<CalculateQuoteDetailDto> {
    const productAttribute = detailedQuote.quoteFinanceProduct.financeProduct
      .productAttribute as LeaseProductAttributesDto;
    productAttribute.leaseAmount = detailedQuote.quoteCostBuildup.grossAmount;

    const query = {
      isSolar: detailedQuote.isSolar,
      isRetrofit: detailedQuote.isRetrofit,
      utilityProgramName: detailedQuote.utilityProgram.utilityProgramName || 'PRP2',
      contractTerm: productAttribute.leaseTerm,
      storageSize: sumBy(
        detailedQuote.quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.sizekWh,
      ),
      rateEscalator: productAttribute.rateEscalator,
      capacityKW: detailedQuote.systemProduction.capacityKW,
      productivity: detailedQuote.systemProduction.productivity,
    };

    const leaseSolverConfig = await this.leaseSolverConfigService.getDetail(query);

    if (!leaseSolverConfig) {
      throw ApplicationException.NullEnitityFound('Lease Config');
    }

    const actualSystemCostPerkW = leaseSolverConfig.adjusted_install_cost + 0.1;
    const averageSystemSize = (leaseSolverConfig.solar_size_minimum + leaseSolverConfig.solar_size_maximum) / 2;
    const averageProductivity = (leaseSolverConfig.productivity_min + leaseSolverConfig.productivity_max) / 2;
    const rateDeltaPerkWh =
      (actualSystemCostPerkW - leaseSolverConfig.adjusted_install_cost) *
      leaseSolverConfig.rate_factor *
      averageSystemSize *
      1000;
    const adjustedSolarRate = leaseSolverConfig.rate_per_kWh + rateDeltaPerkWh;
    const monthlyLeasePayment =
      (adjustedSolarRate * averageSystemSize * averageProductivity) / 12 + leaseSolverConfig.storage_payment;

    productAttribute.monthlyLeasePayment = monthlyLeasePayment;
    productAttribute.ratePerkWh = leaseSolverConfig.rate_per_kWh;
    productAttribute.yearlyLoanPaymentDetails = this.getYearlyLeasePaymentDetails(
      productAttribute.leaseTerm,
      monthlyLeasePayment,
    );
    productAttribute.currentMonthlyAverageUtilityPayment = await this.getCurrentMonthlyAverageUtilityPayment(
      detailedQuote.opportunityId,
    );
    productAttribute.monthlyEnergyPayment = monthlyLeasePayment + productAttribute.currentMonthlyAverageUtilityPayment;
    productAttribute.monthlyUtilityPayment = monthlyUtilityPayment;
    detailedQuote.quoteFinanceProduct.financeProduct.productAttribute = productAttribute;
    return detailedQuote;
  }

  private getYearlyLeasePaymentDetails(leaseTerm: number, monthlyLeasePayment: number) {
    const currentDate = new Date();
    const totalMonth = leaseTerm * 12;
    let accumulationMonth = 0;
    let month = currentDate.getMonth() + 1;
    let startYear = currentDate.getFullYear();
    const yearlyLeasePaymentDetails = [];
    let monthlyPaymentDetails = [];

    while (accumulationMonth < totalMonth) {
      monthlyPaymentDetails.push({ month, paymentAmount: monthlyLeasePayment });
      month += 1;
      accumulationMonth += 1;
      if (month === 12) {
        yearlyLeasePaymentDetails.push({ year: startYear, monthlyPaymentDetails });
        monthlyPaymentDetails = [];
        month = 1;
        startYear += 1;
      }
    }

    return yearlyLeasePaymentDetails;
  }

  private async getCurrentMonthlyAverageUtilityPayment(opportunityId: string) {
    const utility = await this.utilityService.getUtilityByOpportunityId(opportunityId);
    const totalCost = sumBy(utility.cost_data.typical_usage_cost.cost, item => item.v);
    const lenCost = utility.cost_data.typical_usage_cost.cost.length;
    return totalCost / lenCost;
  }

  calculateLoanSolver(
    detailedQuote: CalculateQuoteDetailDto,
    annualInterestRate: number,
    loanAmount: number,
    startDate: Date,
    loanPeriod: number,
    principlePaymentPeriodStart: number,
    prepaymentAmount: number,
    periodPrepayment: number,
    approximateAccuracy: number,
    monthlyUtilityPayment: number,
  ): CalculateQuoteDetailDto {
    const productAttribute = detailedQuote.quoteFinanceProduct.financeProduct
      .productAttribute as LoanProductAttributesDto;
    const startingMonthyPaymentBeforePrePayment = this.getPaymentAmountBeforePrePayment({
      loanAmount,
      annualInterestRate,
      periodStart: principlePaymentPeriodStart,
    });

    const tempPeriod = loanPeriod - principlePaymentPeriodStart;
    const tempPrincipleAmount = loanAmount - prepaymentAmount;

    let startingMonthyPaymentAfterPrePayment = this.getPaymentAmountAfterPrePayment({
      loanAmount: tempPrincipleAmount,
      annualInterestRate,
      periodStart: tempPeriod,
    });

    const genLoanDataParam = {
      loanAmount,
      annualInterestRate,
      loanStartDate: startDate,
      totalPeriod: loanPeriod,
      amountOfPrePayment: prepaymentAmount,
      monthOfPrePayment: periodPrepayment,
      periodWhenPrinciplePaymentStarts: principlePaymentPeriodStart,
    };

    const { prePaymentPeriodInterestTotal } = this.calculateAmortizationSchedule(
      startingMonthyPaymentBeforePrePayment,
      startingMonthyPaymentAfterPrePayment,
      genLoanDataParam,
    );

    const newStartingMonthyPaymentBeforePrePayment = toFixNumber(
      prePaymentPeriodInterestTotal / (principlePaymentPeriodStart - 2),
      2,
    );

    let iterationSteps = approximateAccuracy < 0 ? 0.01 : approximateAccuracy;
    let stopIteration = false;
    let tempLoanSolvers: IPayPeriodData[] = [];

    while (!stopIteration) {
      const { loanSolvers } = this.calculateAmortizationSchedule(
        newStartingMonthyPaymentBeforePrePayment,
        startingMonthyPaymentAfterPrePayment,
        genLoanDataParam,
      );

      if (loanSolvers[loanSolvers.length - 1].endingBalance > 0) {
        startingMonthyPaymentAfterPrePayment = toFixNumber(startingMonthyPaymentAfterPrePayment + iterationSteps, 2);
        const { loanSolvers } = this.calculateAmortizationSchedule(
          newStartingMonthyPaymentBeforePrePayment,
          startingMonthyPaymentAfterPrePayment,
          genLoanDataParam,
        );

        const theLastMonth = loanSolvers[loanSolvers.length - 1];

        const finalMonthPayment =
          theLastMonth.monthlyPayment + theLastMonth.endingBalance + theLastMonth.unpaidInterestCumulative;

        theLastMonth.adjustedMonthlyPayment = toFixNumber(finalMonthPayment, 2);
        tempLoanSolvers = loanSolvers;
        stopIteration = true;
      } else {
        startingMonthyPaymentAfterPrePayment = toFixNumber(startingMonthyPaymentAfterPrePayment - iterationSteps, 2);
      }
    }

    const groupByYears = groupBy(tempLoanSolvers, item => new Date(item.paymentDueDate).getFullYear());
    const monthlyCosts = Object.keys(groupByYears).reduce(
      (acc, item) => [...acc, { year: item, monthlyPaymentDetails: groupByYears[item] }],
      [],
    );

    (productAttribute as any).yearlyLoanPaymentDetails = monthlyCosts;
    productAttribute.monthlyUtilityPayment = monthlyUtilityPayment;
    detailedQuote.quoteFinanceProduct.financeProduct.productAttribute = productAttribute;
    return detailedQuote;
  }

  getMonthlyInterestRate(annualInterestRate: number) {
    return annualInterestRate / 100 / 12;
  }

  getPaymentAmountBeforePrePayment(data: IGetPaymentAmount) {
    const { annualInterestRate, loanAmount } = data;
    const interestRateMonthly = this.getMonthlyInterestRate(annualInterestRate);
    return toFixNumber(loanAmount * interestRateMonthly, 2);
  }

  getPaymentAmountAfterPrePayment(data: IGetPaymentAmount) {
    const { annualInterestRate, loanAmount, periodStart } = data;
    const interestRateMonthly = this.getMonthlyInterestRate(annualInterestRate);
    const paymentMonthly =
      loanAmount *
      ((interestRateMonthly * (interestRateMonthly + 1) ** periodStart) /
        ((interestRateMonthly + 1) ** periodStart - 1));

    return toFixNumber(paymentMonthly, 2);
  }

  calculateAmortizationSchedule(
    startingMonthlyPaymentBeforePrePayment: number,
    startingMonthlyPaymentAfterPrePayment: number,
    genLoanDataParam: IGenLoanDataParam,
  ) {
    const { loanStartDate, loanAmount } = genLoanDataParam;
    const loanSolvers: IPayPeriodData[] = [];
    let paymentNumberCounter = -2;
    let daysInCurrentMonth: number;
    let daysInCurrentYear: number;
    let runningBalancePrinciple = loanAmount;
    let runningUnpaidInterest = 0;
    let prePaymentPeriodInterestTotal = 0;

    for (let periodCounter = 0; periodCounter <= genLoanDataParam.totalPeriod; periodCounter += 1) {
      paymentNumberCounter += 1;
      const payPeriodDataInst = {
        paymentDueDate: '',
        daysInPeriod: 0,
        daysInYear: 0,
        period: 0,
        paymentNumber: 0,
        startingBalance: 0,
        monthlyPayment: 0,
        interestComponent: 0,
        principleComponent: 0,
        endingBalance: 0,
        prePaymentAmount: 0,
        unpaidInterestForCurrentMonth: 0,
        unpaidInterestCumulative: 0,
        adjustedMonthlyPayment: 0,
      } as IPayPeriodData;

      const previousPeriodDate = getPaymentDueDateByPeriod(
        loanStartDate.getFullYear(),
        periodCounter,
        loanStartDate.getMonth() - 1,
      );

      daysInCurrentYear = getDaysInYear(previousPeriodDate.getFullYear());
      payPeriodDataInst.period = periodCounter;
      payPeriodDataInst.paymentNumber = paymentNumberCounter < 0 ? 0 : paymentNumberCounter;
      payPeriodDataInst.paymentDueDate = getPaymentDueDateByPeriod(
        loanStartDate.getFullYear(),
        periodCounter,
        loanStartDate.getMonth(),
      ).toLocaleDateString();
      payPeriodDataInst.daysInYear = daysInCurrentYear;

      if (payPeriodDataInst.period === genLoanDataParam.monthOfPrePayment) {
        payPeriodDataInst.prePaymentAmount = genLoanDataParam.amountOfPrePayment;
      }
      if (periodCounter === 0) {
        payPeriodDataInst.startingBalance = loanAmount;
        payPeriodDataInst.endingBalance = loanAmount;
        loanSolvers.push(payPeriodDataInst);
        continue;
      }

      payPeriodDataInst.startingBalance = runningBalancePrinciple - payPeriodDataInst.prePaymentAmount;

      daysInCurrentMonth = getDaysInMonth(previousPeriodDate.getFullYear(), previousPeriodDate.getMonth());
      payPeriodDataInst.daysInPeriod = daysInCurrentMonth;

      // TODO: need to confirm
      payPeriodDataInst.interestComponent =
        (payPeriodDataInst.startingBalance *
          payPeriodDataInst.daysInPeriod *
          (genLoanDataParam.annualInterestRate / 100)) /
        payPeriodDataInst.daysInYear;

      if (payPeriodDataInst.period >= genLoanDataParam.periodWhenPrinciplePaymentStarts) {
        // AFTER prepayment periods
        payPeriodDataInst.monthlyPayment = startingMonthlyPaymentAfterPrePayment;
        payPeriodDataInst.principleComponent = payPeriodDataInst.monthlyPayment - payPeriodDataInst.interestComponent;
      } else {
        //  BEFORE PREPAYMENT PERIOD
        payPeriodDataInst.monthlyPayment =
          payPeriodDataInst.paymentNumber <= 0 ? 0 : startingMonthlyPaymentBeforePrePayment;
        payPeriodDataInst.unpaidInterestForCurrentMonth =
          payPeriodDataInst.interestComponent - payPeriodDataInst.monthlyPayment;
        runningUnpaidInterest = runningUnpaidInterest + payPeriodDataInst.unpaidInterestForCurrentMonth;
        prePaymentPeriodInterestTotal = prePaymentPeriodInterestTotal + payPeriodDataInst.interestComponent;
      }

      payPeriodDataInst.unpaidInterestCumulative = runningUnpaidInterest;
      payPeriodDataInst.endingBalance = payPeriodDataInst.startingBalance - payPeriodDataInst.principleComponent;
      payPeriodDataInst.adjustedMonthlyPayment = payPeriodDataInst.monthlyPayment;
      runningBalancePrinciple = payPeriodDataInst.endingBalance;
      loanSolvers.push(payPeriodDataInst);
    }
    return { loanSolvers, prePaymentPeriodInterestTotal };
  }
}
