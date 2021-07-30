import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsJWT, IsMongoId, IsNotEmpty } from 'class-validator';
import { PROPOSAL_ANALYTIC_TYPE } from '../constants';

export class SaveProposalAnalyticDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  proposalId: string;

  @ApiProperty()
  @IsNotEmpty()
  viewBy: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PROPOSAL_ANALYTIC_TYPE)
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsJWT()
  token: string;
}
