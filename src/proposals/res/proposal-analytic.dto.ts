import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { TRACKING_TYPE } from '../schemas/proposal-analytic.schema';

export class TrackingDto {
  @ExposeProp()
  by: string[];

  @ExposeProp()
  at: Date;

  @ExposeProp({ enum: TRACKING_TYPE })
  type: TRACKING_TYPE;
}

export class ProposalAnalyticDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  proposalId: string;

  @ExposeProp()
  viewBy: string;

  @ExposeProp()
  tracking: TrackingDto[];
}
