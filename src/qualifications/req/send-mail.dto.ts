import { ApiProperty } from '@nestjs/swagger';

class AgentDetailDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  userId: string;
}

export class SendMailReqDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  qualificationCreditId: string;

  @ApiProperty({ type: AgentDetailDto })
  agentDetail: AgentDetailDto;
}
