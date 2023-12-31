import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Types } from 'mongoose';
import { INVERTER_TYPE } from '../../constants';

export class InverterDto {
  @ApiProperty({ enum: [INVERTER_TYPE.MICRO, INVERTER_TYPE.STRING] })
  @IsOptional()
  type: INVERTER_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  inverterModelId: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  arrayId: Types.ObjectId;
}
