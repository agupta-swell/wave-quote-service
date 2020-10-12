import { Injectable } from '@nestjs/common';
import { sumBy } from 'lodash';
import { LeaseSolverConfigService } from '../../lease-solver-configs/lease-solver-config.service';
import { UtilityService } from '../../utilities/utility.service';
import { LeaseProductAttributesDto } from '../req/sub-dto';
import { ApplicationException } from './../../app/app.exception';
import { CalculateQuoteDetailDto } from './../req';

@Injectable()
export class CalculationService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly leaseSolverConfigService: LeaseSolverConfigService,
  ) {}

  async calculateLeaseQuote(detailedQuote: CalculateQuoteDetailDto): Promise<CalculateQuoteDetailDto> {
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
      console.log('Cannot find leaseSolverConfig with query:', query);
      throw ApplicationException.NullEnitityFound('Lease Config');
    }

    const actualSystemCostPerkW = productAttribute.leaseAmount / detailedQuote.systemProduction.capacityKW;
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
}
