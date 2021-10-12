import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AncillaryEquipmentDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  @IsNotEmpty()
  ancillaryId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
