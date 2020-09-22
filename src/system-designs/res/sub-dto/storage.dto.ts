import { ApiProperty } from '@nestjs/swagger';
import { STORAGE_TYPE } from '../../constants';
import { ProductDto } from './product.dto';
import { QuoteDataDto } from './quote-data.dto';

export class StorageDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: [STORAGE_TYPE.BACKUP_POWER, STORAGE_TYPE.SELF_CONSUMPTION, STORAGE_TYPE.TOU] })
  type: STORAGE_TYPE;

  @ApiProperty()
  storageModelId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  storageModelDataSnapshot: ProductDto;

  @ApiProperty()
  storageModelSnapshotDate: Date;

  @ApiProperty({ type: QuoteDataDto })
  storageQuote: QuoteDataDto;
}