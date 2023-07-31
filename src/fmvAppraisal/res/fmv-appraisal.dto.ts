import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class FmvAppraisalDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  endDate: Date;

  @ExposeProp()
  projectTypes: string[];

  @ExposeProp()
  utilityIds: string[];

  @ExposeProp()
  regionIds: string[];

  @ExposeProp()
  taxCreditConfigIds: string[];

  @ExposeProp()
  solarManufacturerIds: string[];

  @ExposeProp()
  inverterManufacturerIds: string[];

  @ExposeProp()
  energyStorageManufacturerIds: string[];

  @ExposeProp()
  escalator: number;

  @ExposeProp()
  effectiveDate: Date;

  @ExposeProp()
  fundId: string;

  @ExposeProp()
  solarRatePerKw: number;

  @ExposeProp()
  stateCode: string;

  @ExposeProp()
  storageRatePerKwh: number;

  @ExposeProp()
  usedByTranches: boolean;

  @ExposeProp()
  termYears: number;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  modifiedAt: Date;
}
