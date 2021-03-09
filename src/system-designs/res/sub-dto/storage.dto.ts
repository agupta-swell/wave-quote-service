import { ApiProperty } from '@nestjs/swagger';
import { BATTERY_PURPOSE } from '../../constants';
import { ProductDto } from './product.dto';

export class StorageDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: [BATTERY_PURPOSE.BACKUP_POWER, BATTERY_PURPOSE.ADVANCED_TOU_SELF_CONSUMPTION, BATTERY_PURPOSE.PV_SELF_CONSUMPTION] })
  purpose: BATTERY_PURPOSE;

  @ApiProperty()
  storageModelId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ type: ProductDto })
  storageModelDataSnapshot: ProductDto;

  @ApiProperty()
  storageModelSnapshotDate: Date;
}
