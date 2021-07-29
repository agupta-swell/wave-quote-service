import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { INVERTER_TYPE } from '../../constants';

export class InverterDto {
  @ApiProperty({ enum: [INVERTER_TYPE.MICRO, INVERTER_TYPE.STRING] })
  @IsOptional()
  type: INVERTER_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inverterModelId: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  quantity: number;
}
