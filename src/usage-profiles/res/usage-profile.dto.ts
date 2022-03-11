import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { ISeason, IUsageProfile } from '../interfaces';

class SeasonResDto implements ISeason {
  @ExposeProp()
  applicableMonths: number[];

  @ExposeProp()
  hourlyAllocation: number[];
}

export class UsageProfileResDto implements IUsageProfile {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  createdBy: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  name: string;

  @ExposeProp({ type: [SeasonResDto] })
  seasons: SeasonResDto[];

  @ExposeProp()
  updatedAt: Date;

  @ExposeProp()
  updatedBy: string;
}
