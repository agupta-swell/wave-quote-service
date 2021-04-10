import { ApiProperty } from '@nestjs/swagger';
import { PvModuleDetailDataDto, StorageQuoteDto } from '.';

export class SolarStorageQuoteDto {
  @ApiProperty()
  numberOfPanels: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ type: PvModuleDetailDataDto })
  pvModuleDetailData: PvModuleDetailDataDto;

  @ApiProperty({ type: [StorageQuoteDto] })
  storageData: StorageQuoteDto[];
}
