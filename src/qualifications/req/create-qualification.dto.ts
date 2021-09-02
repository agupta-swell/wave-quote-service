import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { QUALIFICATION_TYPE } from '../constants';

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

  @ApiProperty()
  @IsEnum(QUALIFICATION_TYPE)
  @IsNotEmpty()
  type: QUALIFICATION_TYPE;
}
