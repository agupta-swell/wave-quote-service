import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AncillaryEquipmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ancillaryId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
