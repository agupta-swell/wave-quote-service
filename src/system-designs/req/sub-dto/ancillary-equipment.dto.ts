import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { COMPONENT_TYPE } from 'src/system-designs/constants';

export class AncillaryEquipmentDto {
  @ApiProperty()
  @IsString()
  manufacturer: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty({ enum: COMPONENT_TYPE })
  @IsString()
  relatedComponent: COMPONENT_TYPE;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  averageWholeSalePrice: number;

  @ApiProperty()
  @IsString()
  applicableProductManufacturer: string;
}
