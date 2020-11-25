import { ApiProperty } from '@nestjs/swagger';

export class SetManualApprovalDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  agentFullName: string;

  @ApiProperty()
  agentUserId: string;
}
