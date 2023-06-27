import { forwardRef, Inject } from '@nestjs/common';
import { buildMonthlyAndAnnualDataFromHour8760 } from 'src/utils/transformData';
import { roundNumber } from 'src/utils/transformNumber';
import { IUtilityUsageDetails } from '../utility.schema';
import { UtilityService } from '../utility.service';

export class UsageProfileProductionService {
  constructor(
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
  ) {}

  async calculateUsageProfile(utility: IUtilityUsageDetails) {
    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      utility.opportunityId,
      true,
    );
    const hourlyExistingPVInKWh = existingSystemProduction.hourlyProduction.map(e => e / 1000);

    const hourlyEstimatedUsage = this.utilityService.getHourlyEstimatedUsage(utility);

    // computedAdditions = hourlyEstimatedUsage - computedUsage
    // Because computedAdditions is the Planned Usage Increases so it's positive number
    // In some cases, hourlyEstimatedUsage and computedUsage are equal but be different within a small margin (1.234567898765432 - 1.2345678987654323).
    // The result of the minus will be -0 so Math.abs is used.
    const hourlyComputedAdditions = hourlyEstimatedUsage.map((v, i) =>
      Math.abs(roundNumber(v - utility.utilityData.computedUsage.hourlyUsage[i].v)),
    );

    // homeUsageProfile
    const hourlyHomeUsageProfile = this.utilityService.calculate8760OnActualMonthlyUsage(
      utility.utilityData.typicalBaselineUsage.typicalHourlyUsage.map(({ v }) => v),
      utility.utilityData.computedUsage.monthlyUsage.map(({ v, i }) => {
        const foundExistingPVMonthly = existingSystemProduction.monthlyProduction.find(item => item.i === i);

        return (foundExistingPVMonthly?.v || 0) + v;
      }),
    ) as number[];

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
