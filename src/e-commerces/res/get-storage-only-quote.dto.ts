import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { StorageQuoteDto } from './sub-dto';

export class GetStorageOnlyQuoteDto {
  @ApiProperty({ type: [StorageQuoteDto] })
  storageData: StorageQuoteDto[];
}

export class GetStorageOnlyQuoteRes implements ServiceResponse<GetStorageOnlyQuoteDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetStorageOnlyQuoteDto })
  data: GetStorageOnlyQuoteDto;
}