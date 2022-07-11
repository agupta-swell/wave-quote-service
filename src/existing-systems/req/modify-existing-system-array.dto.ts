import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ModifyExistingSystemArrayDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  existingPVAzimuth?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  existingPVPitch?: number;

  @ApiProperty()
  @IsNumber()
  existingPVSize: number;
}
