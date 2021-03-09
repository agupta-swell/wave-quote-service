import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BATTERY_PURPOSE } from '../../constants';

export class StorageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storageModelId: string;

  @ApiProperty()
  reserve: number;

  @ApiProperty({ enum: [BATTERY_PURPOSE.BACKUP_POWER, BATTERY_PURPOSE.ADVANCED_TOU_SELF_CONSUMPTION, BATTERY_PURPOSE.PV_SELF_CONSUMPTION] })
  @IsEnum(BATTERY_PURPOSE)
  purpose: BATTERY_PURPOSE;
}
