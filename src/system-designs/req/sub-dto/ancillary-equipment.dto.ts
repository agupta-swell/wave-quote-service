import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class AncillaryEquipmentDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  @IsNotEmpty()
  ancillaryId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
