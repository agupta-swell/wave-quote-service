import { ApiProperty } from '@nestjs/swagger';
import { STORAGE_TYPE } from '../constants';
import { ProductDto } from './product.dto';

export class StorageDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: [STORAGE_TYPE.BACKUP_POWER, STORAGE_TYPE.SELF_CONSUMPTION, STORAGE_TYPE.TOU] })
  type: STORAGE_TYPE;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  storageModelDataSnapshot: ProductDto;

  @ApiProperty()
  storageModelSnapshotDate: Date;
}
