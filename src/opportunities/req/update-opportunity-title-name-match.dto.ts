import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateOpportunityTiltleNameMatchDto {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  alternateTitleDocumentationSubmitted: boolean;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  alternateTitleDocumentationSubmitDate: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  alternateTitleDocumentationName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  alternateTitleDocumentationAddress: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  applicantNameMatchesTitle: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  coapplicantNameMatchesTitle: boolean;
}

