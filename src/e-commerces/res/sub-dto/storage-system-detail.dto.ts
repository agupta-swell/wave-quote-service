import { ApiProperty } from '@nestjs/swagger';

export class StorageSystemDetailDataDto {
  @ApiProperty()
  storageSystemCount: number;

  @ApiProperty()
  storageSystemKwh: number;

  @ApiProperty()
  numberOfDaysBackup: number;

  @ApiProperty()
  backupDetailsTest: string;
}
