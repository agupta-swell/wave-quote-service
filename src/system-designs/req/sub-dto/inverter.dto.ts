import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { INVERTER_TYPE } from '../../constants';

export class InverterDto {
  @ApiProperty({ enum: [INVERTER_TYPE.MICRO, INVERTER_TYPE.STRING] })
  @IsNotEmpty()
  type: INVERTER_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inverterModelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
