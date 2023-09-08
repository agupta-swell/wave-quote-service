import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateLatestQuoteDto {
  @ApiProperty()
  @IsString()
  quoteId: string;

  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsMongoId()
  systemDesignId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fundingSourceId: string;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  utilityProgramId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  partnerId: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isArchived: boolean;

  @IsOptional()
  @IsString()
  solverId: string;
}