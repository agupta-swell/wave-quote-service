import { roundNumber } from 'src/utils/transformNumber';
import { buildMonthlyAndAnnualDataFromHour8760 } from 'src/utils/transformData';
import { Inject, forwardRef } from '@nestjs/common';
import { IUtilityUsageDetails } from '../utility.schema';
import { UtilityService } from '../utility.service';

export class UsageProfileProductionService {
  constructor(
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
  ) {}

  async calculateUsageProfile(utility: IUtilityUsageDetails) {
    const hourlyEstimatedUsage = this.utilityService.getHourlyEstimatedUsage(utility);

    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      utility.opportunityId,
      true,
    );
    const hourlyExistingPVInKWh = existingSystemProduction.hourlyProduction.map(e => e / 1000);

    // computedAdditions = hourlyEstimatedUsage - computedUsage
    const hourlyComputedAdditions = hourlyEstimatedUsage.map((v, i) =>
      Math.abs(roundNumber(v - utility.utilityData.computedUsage.hourlyUsage[i].v)),
    );
    // homeUsageProfile
    const hourlyHomeUsageProfile = utility.utilityData.computedUsage.hourlyUsage?.map(
      ({ v }, i) => v + (hourlyExistingPVInKWh[i] || 0),
    );
    // adjustedUsageProfile
    const hourlyAdjustedUsageProfile = hourlyHomeUsageProfile.map((v, i) => v + hourlyComputedAdditions[i]);
    // currentUsageProfile
    const hourlyCurrentUsageProfile = hourlyHomeUsageProfile.map((v, i) => v - (hourlyExistingPVInKWh[i] || 0));
    // plannedProfile
    const hourlyPlannedProfile = hourlyAdjustedUsageProfile.map((v, i) => v - (hourlyExistingPVInKWh[i] || 0));

    const {
      monthlyProduction: monthlyComputedAdditions,
      annualProduction: annualComputedAdditions,
    } = buildMonthlyAndAnnualDataFromHour8760(hourlyComputedAdditions);

    const {
      annualProduction: annualHomeUsageProfile,
      monthlyProduction: monthlyHomeUsageProfile,
    } = buildMonthlyAndAnnualDataFromHour8760(hourlyHomeUsageProfile);

    const {
      annualProduction: annualAdjustedUsageProfile,
      monthlyProduction: monthlyAdjustedUsageProfile,
    } = buildMonthlyAndAnnualDataFromHour8760(hourlyAdjustedUsageProfile);

    const {
      annualProduction: annualCurrentUsageProfile,
      monthlyProduction: monthlyCurrentUsageProfile,
    } = buildMonthlyAndAnnualDataFromHour8760(hourlyCurrentUsageProfile);

    const {
      annualProduction: annualPlannedProfile,
      monthlyProduction: monthlyPlannedProfile,
    } = buildMonthlyAndAnnualDataFromHour8760(hourlyPlannedProfile);

    return {
      annualComputedAdditions,
      monthlyComputedAdditions,
      hourlyComputedAdditions,
      annualHomeUsageProfile,
      monthlyHomeUsageProfile,
      hourlyHomeUsageProfile,
      annualAdjustedUsageProfile,
      monthlyAdjustedUsageProfile,
      hourlyAdjustedUsageProfile,
      annualCurrentUsageProfile,
      monthlyCurrentUsageProfile,
      hourlyCurrentUsageProfile,
      annualPlannedProfile,
      monthlyPlannedProfile,
      hourlyPlannedProfile,
    };
  }
}
