import { INVERTER_TYPE } from 'src/products-v2/constants';
import { Default, ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { ExistingSystemArrayResDto } from './existing-system-array.res.dto';
import { ExistingSystemStorageResDto } from './existing-system-storage-res.dto';

export class ExistingSystemResDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  hasGrantedHomeBatterySystemRights: boolean;

  @ExposeProp()
  hasHadOtherDemandResponseProvider: boolean;

  @ExposeProp()
  interconnectedWithExistingSystem: boolean;

  @ExposeProp()
  originalInstaller: string;

  @ExposeProp()
  existingPVSize: number;

  @ExposeProp()
  yearSystemInstalled: number;

  @ExposeProp()
  inverterType: INVERTER_TYPE;

  @ExposeProp()
  financeType: string;

  @ExposeProp()
  @Default('Unknown')
  inverterManufacturerName: string;

  @ExposeAndMap({}, ({ obj, key }) => obj[key] && obj[key].toString())
  inverterManufacturerId: string;

  @ExposeProp()
  inverterModel: string;

  @ExposeProp({
    isArray: true,
    type: ExistingSystemArrayResDto,
  })
  @Default([])
  array: ExistingSystemArrayResDto[];

  @ExposeProp({
    isArray: true,
    type: ExistingSystemStorageResDto,
  })
  @Default([])
  storages: ExistingSystemStorageResDto[];

  @ExposeProp()
  tpoFundingSource: string;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  updatedAt: Date;
}
