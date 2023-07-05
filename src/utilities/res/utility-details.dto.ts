import { ElectricVehicleSnapshotResDto } from 'src/electric-vehicles/res/electric-vehicles-snapshot-res.dto';
import { Default, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { UsageProfileResDto } from 'src/usage-profiles/res';
import { ENTRY_MODE } from '../constants';
import { CostDataDto } from './cost-data.dto';
import { MonthSeasonTariffDto, UsageProfileProductionDto, UtilityDataDto } from './utility-data.dto';

export class UtilityDetailsDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp({ type: UtilityDataDto })
  utilityData: UtilityDataDto;

  @ExposeProp({ type: CostDataDto })
  costData: CostDataDto;

  @ExposeProp()
  entryMode: ENTRY_MODE;

  @ExposeProp()
  @Default()
  poolValue: number;

  @ExposeProp()
  usageProfileSnapshotDate?: Date;

  @ExposeProp()
  usageProfileId?: string;

  @ExposeProp({ type: UsageProfileResDto })
  usageProfileSnapshot: UsageProfileResDto;

  @ExposeProp()
  @Default()
  increaseAmount: number;

  @ExposeProp({ type: [ElectricVehicleSnapshotResDto] })
  electricVehicles: ElectricVehicleSnapshotResDto[];

  @ExposeProp()
  totalPlannedUsageIncreases: number;

  @ExposeProp()
  monthlyTariffData: MonthSeasonTariffDto[][];

  @ExposeProp()
  hasMedicalBaseline?: boolean;

  @ExposeProp()
  medicalBaselineAmount?: number;

  @ExposeProp({ type: UsageProfileProductionDto })
  computedAdditions: UsageProfileProductionDto;

  @ExposeProp({ type: UsageProfileProductionDto })
  homeUsageProfile: UsageProfileProductionDto;

  @ExposeProp({ type: UsageProfileProductionDto })
  adjustedUsageProfile: UsageProfileProductionDto;

  @ExposeProp({ type: UsageProfileProductionDto })
  currentUsageProfile: UsageProfileProductionDto;

  @ExposeProp({ type: UsageProfileProductionDto })
  plannedProfile: UsageProfileProductionDto;

  @ExposeProp()
  isLowIncomeOrDac?: boolean;
}
