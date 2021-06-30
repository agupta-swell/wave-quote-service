import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { groupBy, sumBy } from 'lodash';
import { ApplicationException } from 'src/app/app.exception';
import { LeaseSolverConfigService } from 'src/lease-solver-configs/lease-solver-config.service';
import { UtilityService } from 'src/utilities/utility.service';
import { dateAdd, getDaysInMonth } from 'src/utils/datetime';
import { roundNumber } from 'src/utils/transformNumber';
import { CalculateQuoteDetailDto } from '../req';
import { LeaseProductAttributesDto, LoanProductAttributesDto } from '../req/sub-dto';
import { IPayPeriodData } from '../typing.d';

// eslint-disable-next-line @typescript-eslint/naming-convention
const PAYMENT_ROUNDING = 2;

@Injectable()
export class CalculationService {
  constructor(
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
  ) {}

  async calculateLeaseQuote(
    detailedQuote: CalculateQuoteDetailDto,
    monthlyUtilityPayment: number,
  ): Promise<CalculateQuoteDetailDto> {
    const productAttribute = detailedQuote.quoteFinanceProduct.financeProduct
      .productAttribute as LeaseProductAttributesDto;
    productAttribute.leaseAmount = detailedQuote.quoteCostBuildup.grossPrice;

    const query = {
      isSolar: detailedQuote.isSolar,
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

    const [leaseSolverConfig, utilityUsage] = await Promise.all([
      this.leaseSolverConfigService.getDetailByConditions(query),
      this.utilityService.getUtilityByOpportunityId(detailedQuote.opportunityId),
    ]);
    if (!leaseSolverConfig) {
      throw ApplicationException.NullEntityFound('Lease Config');
    }

    // IMPORTANT NOTE: THIS BELOW LOGIC IS DUPLICATED IN THE calculateLeaseQuoteForECom() METHOD, WHEN CHANGING BELOW LOGIC, PLESE CHECK IF THE CHNAGE WILL HAVE TO BE MADE
    //    IN calculateLeaseQuoteForECom() ALSO.
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

    // IMPORTANT NOTE: THIS ABOVE LOGIC IS DUPLICATED IN THE calculateLeaseQuoteForECom() METHOD, WHEN CHANGING BELOW LOGIC, PLESE CHECK IF THE CHNAGE WILL HAVE TO BE MADE
    //    IN calculateLeaseQuoteForECom() ALSO.

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
    // eslint-disable-next-line no-param-reassign
    detailedQuote.quoteFinanceProduct.financeProduct.productAttribute = productAttribute;

    const actualUsage = sumBy(utilityUsage?.utility_data.actual_usage.monthly_usage, item => item.v);
    const currentBill = sumBy(utilityUsage?.cost_data.actual_usage_cost.cost, item => item.v);
    productAttribute.currentPricePerKwh = currentBill / actualUsage;
    productAttribute.newPricePerKwh = (productAttribute.monthlyEnergyPayment * 12) / actualUsage;

    return detailedQuote;
  }

  async calculateLeaseQuoteForECom(
    isSolar: boolean,
    isRetrofit: boolean,
    leaseAmount: number, // NOTE : FUTURE USE
    contractTerm: number,
    storageSize: number,
    capacityKW: number,
    rateEscalator: number,
    productivity: number,
    addGridServiceDiscount: boolean, // NOTE : FUTURE USE
    utilityProgramName: string,
  ): Promise<{ monthlyLeasePayment: number; rate_per_kWh: number; rate_per_kWh_with_storage: number }> {
    const query = {
      isSolar,
      isRetrofit,
      utilityProgramName: utilityProgramName || 'none',
      contractTerm,
      storageSize,
      rateEscalator,
      capacityKW,
      productivity,
    };

    const leaseSolverConfig = await this.leaseSolverConfigService.getDetailByConditions(query);

    if (!leaseSolverConfig) {
      return { monthlyLeasePayment: -1, rate_per_kWh: -1, rate_per_kWh_with_storage: -1 };
    }

    // IMPORTANT NOTE: THIS BELOW LOGIC IS DUPLICATED IN THE calculateLeaseQuote() METHOD, WHEN CHANGING BELOW LOGIC, PLESE CHECK IF THE CHNAGE WILL HAVE TO BE MADE
    //    IN calculateLeaseQuote() ALSO.
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

    const estimatedAnnualkWh = averageSystemSize * averageProductivity;
    const estimatedAnnualCost = estimatedAnnualkWh * leaseSolverConfig.rate_per_kWh;
    const annualStorageCost = leaseSolverConfig.storage_payment * 12;
    const totalEstimatedAnnualCost = estimatedAnnualCost + annualStorageCost;
    const totalEstimatedCostkWhWithStorage = totalEstimatedAnnualCost / estimatedAnnualkWh;

    // IMPORTANT NOTE: THIS ABOVE LOGIC IS DUPLICATED IN THE calculateLeaseQuote() METHOD, WHEN CHANGING BELOW LOGIC, PLESE CHECK IF THE CHNAGE WILL HAVE TO BE MADE
    //    IN calculateLeaseQuote() ALSO.

    /*
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

    */

    return { monthlyLeasePayment, rate_per_kWh: leaseSolverConfig.rate_per_kWh, rate_per_kWh_with_storage: totalEstimatedCostkWhWithStorage };
  }

  private getYearlyLeasePaymentDetails(leaseTerm: number, monthlyLeasePayment: number) {
    const currentDate = new Date();
    const totalMonth = leaseTerm * 12;
    let accumulationMonth = 0;
    let month = currentDate.getMonth() + 1;
    let startYear = currentDate.getFullYear();
    const yearlyLeasePaymentDetails: any[] = [];
    let monthlyPaymentDetails: any[] = [];

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

  private async getCurrentMonthlyAverageUtilityPayment(opportunityId: string): Promise<number> {
    const utility = await this.utilityService.getUtilityByOpportunityId(opportunityId);
    if (!utility) return 0;
    const totalCost = sumBy(utility.cost_data.typical_usage_cost.cost, item => item.v);
    const lenCost = utility.cost_data.typical_usage_cost.cost.length;
    return totalCost / lenCost;
  }

  async calculateLoanSolver(
    detailedQuote: CalculateQuoteDetailDto,
    monthlyUtilityPayment: number,
  ): Promise<CalculateQuoteDetailDto> {
    const productAttribute = detailedQuote.quoteFinanceProduct.financeProduct
      .productAttribute as LoanProductAttributesDto;

    const annualInterestRate = productAttribute.interestRate;
    const { loanAmount } = productAttribute;
    const startDate = new Date(productAttribute.loanStartDate);
    const loanPeriod = productAttribute.loanTerm;
    const principlePaymentPeriodStart = 18;
    let prepaymentAmount: number = productAttribute.reinvestment?.[0]?.reinvestmentAmount || 0;
    const periodPrepayment: number = productAttribute.reinvestment?.[0]?.reinvestmentMonth || 18; // monthOfPrepayment
    const approximateAccuracy = 0.00001;

    let startingMonthlyPaymentAmount = this.monthlyPaymentAmount(
      loanAmount - prepaymentAmount,
      annualInterestRate,
      loanPeriod - 1,
    );

    let stopIteration = false;
    let iterationInterval = 1;
    let numberOfIterations = 0;
    let previousIterationAmount = startingMonthlyPaymentAmount;
    let v2_cls_AmortTableInstanceWithPrePay: IPayPeriodData[] = [];
    let endingBalanceVariation: any;

    if (PAYMENT_ROUNDING > 0) {
      startingMonthlyPaymentAmount = roundNumber(startingMonthlyPaymentAmount, PAYMENT_ROUNDING);
    }

    while (!stopIteration) {
      numberOfIterations += 1;
      v2_cls_AmortTableInstanceWithPrePay = this.initiateProcess(
        annualInterestRate,
        loanAmount,
        startDate,
        loanPeriod,
        prepaymentAmount,
        principlePaymentPeriodStart,
        startingMonthlyPaymentAmount, // Monthly payment
        'INITIAL BUILD',
        0,
        v2_cls_AmortTableInstanceWithPrePay,
      );

      endingBalanceVariation =
        0 - v2_cls_AmortTableInstanceWithPrePay?.[v2_cls_AmortTableInstanceWithPrePay.length - 1]?.endingBalance || 0;

      if (endingBalanceVariation > 0) {
        if (endingBalanceVariation > approximateAccuracy) {
          startingMonthlyPaymentAmount -= iterationInterval;
          iterationInterval /= 10;
        } else {
          stopIteration = true;
        }
      }

      startingMonthlyPaymentAmount += iterationInterval;

      if (PAYMENT_ROUNDING > 0) {
        startingMonthlyPaymentAmount = roundNumber(startingMonthlyPaymentAmount, PAYMENT_ROUNDING);
      }

      if (previousIterationAmount === startingMonthlyPaymentAmount) {
        stopIteration = true;
      } else {
        previousIterationAmount = startingMonthlyPaymentAmount;
      }

      if (numberOfIterations > 100) {
        stopIteration = true;
      }
    }

    // FIXME: CALCULATE SECOND SET WITHOUT PREPAYMENT

    const endingBalanceAtTheEndOfPrePaymentMonth =
      v2_cls_AmortTableInstanceWithPrePay[periodPrepayment - 1]?.endingBalance || 0;
    startingMonthlyPaymentAmount = this.monthlyPaymentAmount(
      endingBalanceAtTheEndOfPrePaymentMonth,
      annualInterestRate,
      loanPeriod - periodPrepayment,
    );

    if (PAYMENT_ROUNDING > 0) {
      startingMonthlyPaymentAmount = roundNumber(startingMonthlyPaymentAmount, PAYMENT_ROUNDING);
    }

    prepaymentAmount = 0;
    stopIteration = false;
    iterationInterval = 1;
    numberOfIterations = 0;

    let v2_cls_AmortTableInstanceWithoutPrePay: IPayPeriodData[] = [];

    while (!stopIteration) {
      numberOfIterations += 1;
      v2_cls_AmortTableInstanceWithoutPrePay = this.initiateProcess(
        annualInterestRate,
        loanAmount,
        startDate,
        loanPeriod,
        prepaymentAmount,
        principlePaymentPeriodStart,
        startingMonthlyPaymentAmount,
        'ADJUSTED BUILD',
        periodPrepayment,
        v2_cls_AmortTableInstanceWithPrePay,
      );

      endingBalanceVariation =
        0 -
          v2_cls_AmortTableInstanceWithoutPrePay?.[v2_cls_AmortTableInstanceWithoutPrePay.length - 1]?.endingBalance ||
        0;
      if (endingBalanceVariation > 0) {
        if (endingBalanceVariation > approximateAccuracy) {
          startingMonthlyPaymentAmount -= iterationInterval;
          iterationInterval /= 10;
        } else {
          stopIteration = true;
        }
      }

      startingMonthlyPaymentAmount += iterationInterval;

      if (PAYMENT_ROUNDING > 0) {
        startingMonthlyPaymentAmount = roundNumber(startingMonthlyPaymentAmount, PAYMENT_ROUNDING);
      }

      if (previousIterationAmount === startingMonthlyPaymentAmount) {
        stopIteration = true;
      } else {
        previousIterationAmount = startingMonthlyPaymentAmount;
      }

      if (numberOfIterations > 100) {
        stopIteration = true;
      }
    }

    const lastWithoutPaymentElement =
      v2_cls_AmortTableInstanceWithoutPrePay[v2_cls_AmortTableInstanceWithoutPrePay.length - 1];

    const adjustedWithoutPayment = this.adjustLastMonthPayment(
      lastWithoutPaymentElement.monthlyPayment,
      lastWithoutPaymentElement.endingBalance,
    );
    lastWithoutPaymentElement.endingBalance = adjustedWithoutPayment.endingBalance;
    lastWithoutPaymentElement.monthlyPayment = adjustedWithoutPayment.monthlyPayment;

    const lastWithPaymentElement = v2_cls_AmortTableInstanceWithPrePay[v2_cls_AmortTableInstanceWithPrePay.length - 1];
    const adjustedWithPayment = this.adjustLastMonthPayment(
      lastWithPaymentElement.monthlyPayment,
      lastWithPaymentElement.endingBalance,
    );
    lastWithPaymentElement.endingBalance = adjustedWithPayment.endingBalance;
    lastWithPaymentElement.monthlyPayment = adjustedWithPayment.monthlyPayment;

    /// TAO DA SUA O DAY
    const groupByYears = groupBy(v2_cls_AmortTableInstanceWithoutPrePay, item =>
      new Date(item.paymentDueDate).getFullYear(),
    );
    const monthlyCosts = Object.keys(groupByYears).reduce(
      (acc, item) => [...acc, { year: item, monthlyPaymentDetails: groupByYears[item] }],
      [],
    );

    (productAttribute as any).yearlyLoanPaymentDetails = monthlyCosts;
    productAttribute.currentMonthlyAverageUtilityPayment = await this.getCurrentMonthlyAverageUtilityPayment(
      detailedQuote.opportunityId,
    );
    productAttribute.monthlyUtilityPayment = monthlyUtilityPayment;
    // eslint-disable-next-line no-param-reassign
    detailedQuote.quoteFinanceProduct.financeProduct.productAttribute = productAttribute;
    return detailedQuote;
  }

  private monthlyPaymentAmount(principle: number, interestRateAPR: number, numberOfPayments: number): number {
    const interestRateMonthly = this.getMonthlyInterestRate(interestRateAPR);
    const monthlyPayment =
      principle *
      ((interestRateMonthly * (interestRateMonthly + 1) ** numberOfPayments) /
        ((interestRateMonthly + 1) ** numberOfPayments - 1));

    return monthlyPayment;
  }

  getMonthlyInterestRate(annualInterestRate: number): number {
    return annualInterestRate / 100 / 12;
  }

  initiateProcess(
    annaualInterestRate: number,
    loanAmount: number,
    startDate: Date,
    loanPeriodInMonths: number,
    amountOfPrePayment: number,
    monthOfPrePayment: number,
    firstMonthlyPayment: number,
    processingMode: string,
    startingPeriod: number,
    previousAmortTale: IPayPeriodData[],
  ): any {
    let periodCounter: number;
    let paymentNumberCounter: number;
    let currentlyProcessingDate: Date;
    let unpaidInterestForNextMonth: number;
    let previousCycleEndingBalance: number;
    let monthlyPayment: number;
    let adjustedBuildModeFirstPayment = 0;

    let newAmortTable: IPayPeriodData[] = [];

    if (processingMode === 'INITIAL BUILD') {
      periodCounter = 0;
      paymentNumberCounter = 0;
      currentlyProcessingDate = startDate;
      unpaidInterestForNextMonth = 0;
      previousCycleEndingBalance = loanAmount;
      monthlyPayment = firstMonthlyPayment;
    } else {
      newAmortTable = [...previousAmortTale];
      newAmortTable = newAmortTable.slice(0, startingPeriod);
      const lastElement = newAmortTable[newAmortTable.length - 1];
      adjustedBuildModeFirstPayment = lastElement.monthlyPayment;
      periodCounter = lastElement.period;
      paymentNumberCounter = lastElement.paymentNumber;
      currentlyProcessingDate = dateAdd('month', 1, new Date(lastElement.paymentDueDate));
      unpaidInterestForNextMonth = lastElement.unpaidInterestCumulative;
      previousCycleEndingBalance = lastElement.endingBalance;
    }

    for (let i = startingPeriod; i <= loanPeriodInMonths; i++) {
      const payPeriodData: IPayPeriodData = {
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
        unpaidInterest: 0,
        unpaidInterestCumulative: 0,
        adjustedMonthlyPayment: 0,
      };

      if (i > 1) {
        paymentNumberCounter += 1;
      }

      if (startingPeriod === i) {
        monthlyPayment = adjustedBuildModeFirstPayment;
      } else {
        monthlyPayment = firstMonthlyPayment;
      }

      if (paymentNumberCounter > 0) {
        payPeriodData.monthlyPayment = monthlyPayment;
      }

      payPeriodData.daysInYear = 365;
      payPeriodData.period = i;
      payPeriodData.paymentNumber = paymentNumberCounter;
      payPeriodData.paymentDueDate = currentlyProcessingDate.toLocaleDateString();

      if (i > 0) {
        payPeriodData.startingBalance = previousCycleEndingBalance;
        const date = dateAdd('month', -1, currentlyProcessingDate);
        payPeriodData.daysInPeriod = getDaysInMonth(date.getFullYear(), date.getMonth());
      } else {
        payPeriodData.startingBalance = loanAmount;
        payPeriodData.daysInPeriod = 0;
      }

      if (i === monthOfPrePayment) {
        payPeriodData.prePaymentAmount = amountOfPrePayment;
      }

      payPeriodData.interestComponent =
        ((annaualInterestRate / 100) * payPeriodData.startingBalance * payPeriodData.daysInPeriod) /
        payPeriodData.daysInYear;

      payPeriodData.unpaidInterestCumulative = this.getUnPaidInterestCumulative(
        newAmortTable[newAmortTable.length - 1],
      );

      payPeriodData.unpaidInterest = this.getCurrentMonthUnpaidInterest(payPeriodData);

      payPeriodData.principleComponent = this.getCurrentMonthPrincipleComponent(payPeriodData);

      payPeriodData.endingBalance = payPeriodData.startingBalance - payPeriodData.principleComponent;
      previousCycleEndingBalance = payPeriodData.endingBalance;

      newAmortTable.push(payPeriodData);
      currentlyProcessingDate = dateAdd('month', 1, currentlyProcessingDate);
    }

    return newAmortTable;
  }

  getUnPaidInterestCumulative(dataParam: IPayPeriodData) {
    let tmpUnpaidInterest = 0;

    if (!dataParam || dataParam.prePaymentAmount > 0) {
      tmpUnpaidInterest = 0;
    } else {
      const monthlyPaymentMinusCurrentMonthInterest = dataParam.monthlyPayment - dataParam.interestComponent;
      const value3 = Math.min(0, monthlyPaymentMinusCurrentMonthInterest);
      const value2 = value3 + dataParam.unpaidInterestCumulative + dataParam.unpaidInterest;

      tmpUnpaidInterest = Math.min(0, value2);
    }

    return tmpUnpaidInterest;
  }

  getCurrentMonthUnpaidInterest(dataParam: IPayPeriodData): number {
    const max = Math.max(dataParam.unpaidInterestCumulative, dataParam.interestComponent - dataParam.monthlyPayment);
    return -1 * Math.min(0, max);
  }

  getCurrentMonthPrincipleComponent(dataParam: IPayPeriodData): number {
    let value2 = 0;
    const value1 = dataParam.monthlyPayment - dataParam.interestComponent - dataParam.unpaidInterest;

    if (dataParam.prePaymentAmount > 0) {
      const value3 = dataParam.prePaymentAmount + dataParam.unpaidInterestCumulative;
      value2 = Math.max(0, value1 + value3);
    } else {
      value2 = Math.max(0, value1);
    }

    return value2;
  }

  adjustLastMonthPayment(
    monthlyPayment: number,
    endingBalance: number,
  ): { monthlyPayment: number; endingBalance: number } {
    if (!PAYMENT_ROUNDING) {
      return { monthlyPayment, endingBalance };
    }

    const adjustedAmount = monthlyPayment + endingBalance;
    const roundedMonthlyPayment = roundNumber(adjustedAmount, PAYMENT_ROUNDING);

    return {
      monthlyPayment: roundedMonthlyPayment,
      endingBalance: adjustedAmount - roundedMonthlyPayment,
    };
  }
}
