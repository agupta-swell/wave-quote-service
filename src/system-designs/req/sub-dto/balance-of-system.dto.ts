import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { COMPONENT_CATEGORY_TYPE, COMPONENT_TYPE, COST_UNIT_TYPE } from 'src/system-designs/constants';

export class BalanceOfSystemDto {
  @ApiProperty()
  @IsString()
  manufacturer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model: string;

  @ApiPropertyOptional({ enum: COMPONENT_CATEGORY_TYPE })
  @IsOptional()
  @IsEnum(COMPONENT_CATEGORY_TYPE)
  relatedComponentCategory: COMPONENT_CATEGORY_TYPE;

  @ApiPropertyOptional({ enum: COMPONENT_TYPE })
  @IsOptional()
  @IsEnum(COMPONENT_TYPE)
  relatedComponent: COMPONENT_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: COST_UNIT_TYPE })
  @IsOptional()
  @IsEnum(COST_UNIT_TYPE)
  unit: COST_UNIT_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitPrice: number;
}
