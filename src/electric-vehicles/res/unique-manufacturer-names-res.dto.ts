import { ExposeProp } from 'src/shared/decorators';

export class UniqueManufacturerNamesRes {
  @ExposeProp()
  manufacturerNames: string[];
}
