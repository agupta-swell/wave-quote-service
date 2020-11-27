import { ApiProperty } from '@nestjs/swagger';

class AgentDetailDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  userId: string;
}

export class CreateQualificationReqDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty({ type: AgentDetailDto })
  agentDetail: AgentDetailDto;
}
