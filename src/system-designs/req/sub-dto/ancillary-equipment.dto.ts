import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AncillaryEquipmentDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  ancillaryId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
