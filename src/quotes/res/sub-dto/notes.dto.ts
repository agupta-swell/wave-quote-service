import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsString } from 'class-validator';

export class NotesDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsBoolean()
  showOnProposal: boolean;

  @ApiProperty()
  @IsBoolean()
  showOnContract: boolean;

  @ApiProperty()
  @IsBoolean()
  isApproved: boolean;

  @ApiProperty()
  @IsString()
  approvalComment: string;

  @ApiProperty()
  @IsString()
  approvedBy: string;

  @ApiProperty()
  approvedAt: Date | null;
}
