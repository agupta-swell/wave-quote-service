import { Pagination } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { AdderConfig } from '../adder-config.schema';

export class AdderConfigDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  adder: string;

  @ExposeProp()
  price: number;

  @ExposeProp()
  increment: string;

  @ExposeProp()
  modifiedAt: Date;
}

export class AdderConfigResponseDto implements Pagination<AdderConfig> {
  @ExposeProp({ isArray: true, type: AdderConfigDto })
  data: AdderConfig[];

  @ExposeProp()
  total: number;
}
