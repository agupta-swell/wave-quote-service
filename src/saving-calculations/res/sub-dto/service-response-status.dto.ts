import { SERVICE_RESPONSE_STATUS_TYPE } from 'src/saving-calculations/constants';
import { ExposeProp } from 'src/shared/decorators';

export class ServiceResponseStatusDataDto {
  @ExposeProp({ enum: SERVICE_RESPONSE_STATUS_TYPE })
  serviceResponseStatus: SERVICE_RESPONSE_STATUS_TYPE;

  @ExposeProp()
  failureMessage?: string;
}
