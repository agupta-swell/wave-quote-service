import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetPresignedUrlSqtDto {
  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  fileType: string;
}
