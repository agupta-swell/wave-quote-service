import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { STORAGE_TYPE } from '../../constants';
import { QuoteDataDto } from './quote-data.dto';

export class StorageDto {
  @ApiProperty({ enum: [STORAGE_TYPE.BACKUP_POWER, STORAGE_TYPE.SELF_CONSUMPTION, STORAGE_TYPE.TOU] })
  @IsNotEmpty()
  type: STORAGE_TYPE;

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

  @ApiProperty()
  purpose: string;

  @ApiProperty({ type: QuoteDataDto })
  storageQuote: QuoteDataDto;
}
