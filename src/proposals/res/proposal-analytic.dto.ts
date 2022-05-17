import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class TrackingDto {
  @ExposeProp()
  by: string[];

  @ExposeProp()
  at: Date;
}

export class ProposalAnalyticDto {
  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  proposalId: string;

  @ExposeProp()
  viewBy: string;

  @ExposeProp()
  sends: TrackingDto[];

  @ExposeProp()
  views: TrackingDto[];

  @ExposeProp()
  downloads: TrackingDto[];
}
