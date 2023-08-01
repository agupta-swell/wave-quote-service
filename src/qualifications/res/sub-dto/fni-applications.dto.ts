import { FNI_APPLICATION_STATE, FNI_REQUEST_TYPE, FNI_TRANSACTION_STATUS } from 'src/qualifications/constants';
import { ExposeProp } from 'src/shared/decorators';

export class FniApplicationResponseDto {
  @ExposeProp()
  type: FNI_REQUEST_TYPE;

  @ExposeProp()
  transactionStatus: FNI_TRANSACTION_STATUS;

  @ExposeProp()
  rawResponse: Record<string, unknown>;

  @ExposeProp()
  createdAt: Date;
}

export class FniApplicationDto {
  @ExposeProp()
  state: FNI_APPLICATION_STATE;

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

  @ExposeProp()
  fniCurrentDecisionReason: string[];

  @ExposeProp({ isArray: true, type: FniApplicationResponseDto })
  responses: FniApplicationResponseDto[];
}
