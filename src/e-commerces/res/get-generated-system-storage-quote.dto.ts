import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { SolarStorageQuoteDto } from './sub-dto';

export class GetGeneratedSystemStorageQuoteDto {
  @ApiProperty({ type: [SolarStorageQuoteDto] })
  solarStorageQuotes: SolarStorageQuoteDto[];
}

export class GetGeneratedSystemStorageQuoteRes implements ServiceResponse<GetGeneratedSystemStorageQuoteDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetGeneratedSystemStorageQuoteDto })
  data: GetGeneratedSystemStorageQuoteDto;
}
