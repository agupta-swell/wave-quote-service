import { ApiProperty } from '@nestjs/swagger';

export class SetManualApprovalReqDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  agentFullName: string;

  @ApiProperty()
  agentUserId: string;
}
