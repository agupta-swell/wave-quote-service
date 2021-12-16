import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
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
  recipients: RecipientDto[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  proposalValidityPeriod: number;
}
