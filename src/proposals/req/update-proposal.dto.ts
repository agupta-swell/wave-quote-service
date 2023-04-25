import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { RecipientDto } from './create-proposal.dto';

export class UpdateProposalDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isSelected: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  proposalName: string;

  @ApiProperty({ type: RecipientDto, isArray: true })
  @IsOptional()
  @Type(() => RecipientDto)
  @ValidateNested({ each: true })
  @ArrayUnique<RecipientDto>(recipient => recipient.email)
  recipients: RecipientDto[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  proposalValidityPeriod: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isArchived: boolean;
}
