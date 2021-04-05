import { ApiProperty } from '@nestjs/swagger';
import { SERVICE_RESPONSE_STATUS_TYPE } from 'src/saving-calculations/constants';

export class ServiceResponseStatusDataDto {
  @ApiProperty({ enum: SERVICE_RESPONSE_STATUS_TYPE })
  serviceResponseStatus: SERVICE_RESPONSE_STATUS_TYPE;

  @ApiProperty()
  failureMessage?: string;
}
