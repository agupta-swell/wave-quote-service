import { ApiProperty } from '@nestjs/swagger';

export class StorageSystemDetailDataDto {
  @ApiProperty()
  storageSystemCount: number;

  @ApiProperty()
  storageSystemKWh: number;

  @ApiProperty()
  numberOfDaysBackup: number;

  @ApiProperty()
  backupDetailsTest: string;
}
