import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { ServiceResponse } from '../../app/common';
import { QualificationDetailDto } from './qualification.dto';

export class ApplicantConsentDto {
  @ExposeAndMap({ type: QualificationDetailDto }, ({ obj }) => obj.qualificationCredit)
  qualificationCreditData?: QualificationDetailDto;
}

export class ApplicantConsentRes implements ServiceResponse<ApplicantConsentDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ApplicantConsentDto })
  data: ApplicantConsentDto;
}
