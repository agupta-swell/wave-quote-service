import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateProposalLinkDto {
  @ApiProperty()
  @IsMongoId()
  proposalId: string;
}
