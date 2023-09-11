import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateLatestQuoteDto {
  @ApiProperty()
  @IsMongoId()
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
  partnerId: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isArchived: boolean;

  @IsOptional()
  @IsMongoId()
  solverId: string;
}
