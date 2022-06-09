import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBase64,
  IsBoolean,
  IsEmail,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsBase64ByMime } from 'src/shared/validations';

export class RecipientDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastName: string;
}

class DetailedProposalDto {
  @ApiProperty()
  @IsBoolean()
  isSelected: boolean;

  @ApiProperty()
  @IsString()
  proposalName: string;

  @ApiProperty({ type: RecipientDto, isArray: true })
  @IsArray()
  @Type(() => RecipientDto)
  @ValidateNested({ each: true })
  recipients: RecipientDto[];

  @ApiProperty()
  @IsInt()
  proposalValidityPeriod: number;

  @ApiProperty()
  @IsMongoId()
  templateId: string;
}

export class CreateProposalDto {
  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsMongoId()
  systemDesignId: string;

  @ApiProperty()
  @IsString()
  proposalName: string;

  @ApiProperty()
  @IsMongoId()
  quoteId: string;

  @ApiProperty({ type: DetailedProposalDto })
  @Type(() => DetailedProposalDto)
  @ValidateNested()
  detailedProposal: DetailedProposalDto;

  @ApiProperty()
  @IsOptional()
  @IsBase64ByMime('image/png')
  systemDesignThumbnail?: string;
}
