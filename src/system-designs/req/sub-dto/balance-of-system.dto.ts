import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { COMPONENT_CATEGORY_TYPE, COMPONENT_TYPE, COST_UNIT_TYPE } from 'src/system-designs/constants';

export class BalanceOfSystemDto {
  @ApiProperty()
  @IsString()
  manufacturer: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty({ enum: COMPONENT_CATEGORY_TYPE })
  @IsString()
  relatedComponentCategory: COMPONENT_CATEGORY_TYPE;

  @ApiProperty({ enum: COMPONENT_TYPE })
  @IsString()
  relatedComponent: COMPONENT_TYPE;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: COST_UNIT_TYPE })
  @IsString()
  unit: COST_UNIT_TYPE;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;
}
