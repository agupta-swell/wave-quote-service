import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { ServiceResponse } from '../../app/common';
import { QualificationDetailDto } from './qualification.dto';

export class ManualApprovalDto {
  @ExposeProp()
  status: boolean;

  @ExposeProp()
  statusDetail: string;

  @ExposeAndMap({ type: QualificationDetailDto }, ({ obj }) => obj.qualificationCredit)
  qualificationCreditData?: QualificationDetailDto;
}

export class ManualApprovalRes implements ServiceResponse<ManualApprovalDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ManualApprovalDto })
  data: ManualApprovalDto;
}
