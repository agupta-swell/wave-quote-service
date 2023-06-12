import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { GetHomeownersByIdResultResDto } from 'src/property/res/get-homeowners-by-id';
import { ServiceResponse } from '../../app/common';
import { QualificationDetailDto } from './qualification.dto';

export class ApplicantConsentDto {
  @ExposeAndMap({ type: QualificationDetailDto }, ({ obj }) => obj.qualificationCredit)
  qualificationCreditData?: QualificationDetailDto;

  @ExposeProp()
  propertyHomeowners: GetHomeownersByIdResultResDto[];
}

export class ApplicantConsentRes implements ServiceResponse<ApplicantConsentDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ApplicantConsentDto })
  data: ApplicantConsentDto;
}
