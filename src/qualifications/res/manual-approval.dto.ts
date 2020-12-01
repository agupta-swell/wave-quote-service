import { QualificationCredit } from './../qualification.schema';
import { QualificationDto } from './qualification.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from '../../app/common';

interface IProps {
  status: boolean;
  status_detail: string;
}

export class ManualApprovalDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  statusDetail: string;

  @ApiProperty({ type: () => QualificationDto })
  qualificationCreditData?: QualificationDto;

  constructor(props: IProps, qualificationCredit?: QualificationCredit) {
    this.status = props.status;
    this.statusDetail = props.status_detail;
    this.qualificationCreditData = qualificationCredit && new QualificationDto(qualificationCredit);
  }
}

export class ManualApprovalRes implements ServiceResponse<ManualApprovalDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ManualApprovalDto })
  data: ManualApprovalDto;
}
