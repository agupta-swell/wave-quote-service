import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { ServiceResponse } from '../../app/common';
import { QualificationDto } from './qualification.dto';

export class ManualApprovalDto {
  @ExposeProp()
  status: boolean;

  @ExposeProp()
  statusDetail: string;

  @ExposeAndMap({ type: QualificationDto }, ({ obj }) => obj.qualificationCredit)
  qualificationCreditData?: QualificationDto;
}

export class ManualApprovalRes implements ServiceResponse<ManualApprovalDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ManualApprovalDto })
  data: ManualApprovalDto;
}
