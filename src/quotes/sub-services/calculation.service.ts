import { Injectable } from '@nestjs/common';
import { sumBy } from 'lodash';
import { LeaseSolverConfigService } from '../../lease-solver-configs/lease-solver-config.service';
import { UtilityService } from '../../utilities/utility.service';
import { LeaseProductAttributesDto } from '../req/sub-dto';
import { UpdateQuoteDto } from './../req/update-quote.dto';

@Injectable()
export class CalculationService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
  ) {}

  async calculateLeaseQuote(detailedQuote: UpdateQuoteDto) {
    const productAttribute = detailedQuote.quoteFinanceProduct.financeProduct
      .productAttribute as LeaseProductAttributesDto;
    productAttribute.leaseAmount = detailedQuote.quoteCostBuildup.grossAmount;

    const leaseSolverConfig = await this.leaseSolverConfigService.getDetail({
      isSolar: detailedQuote.isSolar,
      isRetrofit: detailedQuote.isRetrofit,
      utilityProgramName: (detailedQuote as any).utilityProgram.utilityProgramName || 'PRP2',
      contractTerm: productAttribute.leaseTerm,
      storageSize: sumBy(
        detailedQuote.quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.sizekWh,
      ),
      rateEscalator: productAttribute.rateEscalator,
      capacityKW: (detailedQuote as any).systemProduction.capacityKW,
      productivity: (detailedQuote as any).systemProduction.productivity,
    });

    const actualSystemCostPerkW = productAttribute.leaseAmount / (detailedQuote as any).systemProduction.capacityKW;
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
}
