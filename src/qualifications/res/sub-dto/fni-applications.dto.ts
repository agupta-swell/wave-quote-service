import { ExposeProp } from 'src/shared/decorators';

export class FniApplicationDto {
  @ExposeProp()
  state: string;

  @ExposeProp()
  refnum?: number;

  @ExposeProp()
  fniProductId?: Date;

  @ExposeProp()
  fniCurrentDecision?: Date;

  @ExposeProp()
  fniCurrentQueueNam?: string;

  @ExposeProp()
  fniCurrentDecisionRecievedAt?: Date;
}
