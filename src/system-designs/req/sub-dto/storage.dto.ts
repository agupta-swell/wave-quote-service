import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BATTERY_PURPOSE } from '../../constants';

export class StorageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  storageModelId: string;

  @ApiProperty()
  minimumReservePercentage: number;

  @ApiProperty({
    enum: [
      BATTERY_PURPOSE.BACKUP_POWER,
      BATTERY_PURPOSE.ADVANCED_TOU_SELF_CONSUMPTION,
      BATTERY_PURPOSE.PV_SELF_CONSUMPTION,
    ],
  })
  @IsEnum(BATTERY_PURPOSE)
  purpose: BATTERY_PURPOSE;
}
