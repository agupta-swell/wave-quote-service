import { ServiceResponse } from 'src/app/common';
import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { QualificationDetailDto } from './qualification.dto';

export class SendMailDto {
  @ExposeAndMap({ type: QualificationDetailDto }, ({ obj }) => obj.qualificationCredit)
  qualificationCreditData: QualificationDetailDto;
}

export class SendMailRes implements ServiceResponse<SendMailDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SendMailDto })
  data: SendMailDto;
}
