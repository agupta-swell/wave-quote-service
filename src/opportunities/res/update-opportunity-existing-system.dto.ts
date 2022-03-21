import { ExposeProp } from 'src/shared/decorators';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export class UpdateOpportunityExistingSystemDto {
  @ExposeProp()
  existingPV: boolean;

  @ExposeProp()
  hasGrantedHomeBatterySystemRights: boolean;

  @ExposeProp()
  hasHadOtherDemandResponseProvider: boolean;

  @ExposeProp()
  interconnectedWithExistingSystem

  @ExposeProp()
  originalInstaller: string;

  @ExposeProp()
  existingPVSize: number;

  @ExposeProp()
  yearSystemInstalled: number;

  @ExposeProp()
  inverter: INVERTER_TYPE_EXISTING_SOLAR;

  @ExposeProp()
  financeType: FINANCE_TYPE_EXISTING_SOLAR;

  @ExposeProp()
  inverterManufacturer: string;

  @ExposeProp()
  inverterModel: string;

  @ExposeProp()
  tpoFundingSource: string;
}
