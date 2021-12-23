import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsJWT, IsOptional, IsString } from 'class-validator';

export class GetPresignedUrlDto {
  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  fileType: string;

  @ApiProperty()
  @IsJWT()
  token: string;

  @ApiProperty()
  @IsBoolean()
  isDownload: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isProposal?: boolean;
}
