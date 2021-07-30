import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsString, ValidateNested } from 'class-validator';

class AgentDetailDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  userId: string;
}

export class SendMailReqDto {
  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsMongoId()
  qualificationCreditId: string;

  @ApiProperty({ type: AgentDetailDto })
  @ValidateNested()
  @Type(() => AgentDetailDto)
  agentDetail: AgentDetailDto;
}
