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

  constructor(props: IProps) {
    this.status = props.status;
    this.statusDetail = props.status_detail;
  }
}

export class ManualApprovalRes implements ServiceResponse<ManualApprovalDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ManualApprovalDto })
  data: ManualApprovalDto;
}
