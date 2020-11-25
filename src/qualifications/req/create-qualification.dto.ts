import { ApiProperty } from '@nestjs/swagger';

class AgentDetailDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  userId: string;
}

export class CreateQualificationDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty({ type: AgentDetailDto })
  agentDetail: AgentDetailDto;
}
