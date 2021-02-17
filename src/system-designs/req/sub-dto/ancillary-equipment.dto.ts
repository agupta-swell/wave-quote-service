import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { COMPONENT_TYPE } from 'src/system-designs/constants';

export class AncillaryEquipmentDto {
  @ApiProperty()
  @IsString()
  manufacturer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model: string;

  @ApiPropertyOptional({ enum: COMPONENT_TYPE })
  @IsOptional()
  @IsEnum(COMPONENT_TYPE)
  relatedComponent: COMPONENT_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  averageWholeSalePrice: number;

  @ApiProperty()
  @IsString()
  applicableProductManufacturer: string;
}
