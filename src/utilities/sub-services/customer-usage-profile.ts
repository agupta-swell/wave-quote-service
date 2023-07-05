import { forwardRef, Inject } from '@nestjs/common';
import { buildMonthlyAndAnnualDataFromHour8760 } from 'src/utils/transformData';
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

    const { hourlyComputedAdditions } = this.utilityService.getHourlyEstimatedUsage(utility);

    // TODO: fix uploaded csv for actualUsage that having 8761 lines for hourly
    // homeUsageProfile
    const hourlyHomeUsageProfile = utility.utilityData.actualUsage?.hourlyUsage
      ? utility.utilityData.actualUsage?.hourlyUsage
          .slice(0, 8759)
          .map(({ v }, i) => v + (hourlyExistingPVInKWh[i] || 0))
      : (this.utilityService.calculate8760OnActualMonthlyUsage(
          utility.utilityData.typicalBaselineUsage.typicalHourlyUsage.map(({ v }) => v),
          utility.utilityData.computedUsage.monthlyUsage.map(({ v, i }) => {
            const foundExistingPVMonthly = existingSystemProduction.monthlyProduction.find(item => item.i === i);

            return (foundExistingPVMonthly?.v || 0) + v;
          }),
        ) as number[]);

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
