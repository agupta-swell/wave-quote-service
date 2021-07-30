import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { REQUEST_CATEGORY, REQUEST_TYPE } from '../../constants';

export class FniCommunicationDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  qualificationCreditId: string;

  @ExposeProp()
  sentOn: Date;

  @ExposeProp()
  receivedOn: Date;

  @ExposeProp()
  vendorRefId: string;

  @ExposeProp()
  requestCategory: REQUEST_CATEGORY;

  @ExposeProp()
  requestType: REQUEST_TYPE;

  @ExposeProp()
  responseStatus: string;

  @ExposeProp()
  responseCode: string;

  @ExposeProp()
  rawDataFromFni: string;

  @ExposeProp()
  errorMessageSentToFni: string[];
}
