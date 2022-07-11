import { BATTERY_TYPE } from 'src/products-v2/constants';
import { Default, ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';

class RatingsResDto {
  @ExposeProp()
  kilowatts: number;

  @ExposeProp()
  kilowattHours: number;
}

export class ExistingSystemStorageResDto {
  @ExposeProp()
  yearInstalled: number;

  @ExposeProp()
  purpose: string;

  @ExposeProp()
  name: string;

  @ExposeAndMap({}, ({ obj, key }) => obj[key] && obj[key].toString())
  manufacturerId: string;

  @ExposeProp()
  @Default('Unknown')
  manufacturerName: string;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  updatedAt: Date;

  @ExposeProp()
  batteryType: BATTERY_TYPE;

  @ExposeProp({ type: RatingsResDto })
  ratings: RatingsResDto;

  @ExposeProp()
  roundTripEfficiency: number;
}
