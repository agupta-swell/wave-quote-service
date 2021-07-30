import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, IsUrl, ValidateNested } from 'class-validator';
import { RecipientDto } from './create-proposal.dto';

export class UpdateProposalDto {
  @ApiProperty()
  @IsBoolean()
  isSelected: boolean;

  @ApiProperty()
  @IsString()
  proposalName: string;

  @ApiProperty({ type: RecipientDto, isArray: true })
  @Type(() => RecipientDto)
  @ValidateNested({ each: true })
  recipients: RecipientDto[];

  @ApiProperty()
  @IsNumber()
  proposalValidityPeriod: number;

  @ApiProperty()
  @IsUrl()
  pdfFileUrl: string;

  @ApiProperty()
  @IsUrl()
  htmlFileUrl: string;
}
