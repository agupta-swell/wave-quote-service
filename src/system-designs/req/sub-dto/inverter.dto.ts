import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { INVERTER_TYPE } from '../../constants';

export class InverterDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ enum: [INVERTER_TYPE.CENTRAL, INVERTER_TYPE.MICRO] })
  @IsNotEmpty()
  type: INVERTER_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  solarPanelArrayId: string;
}
