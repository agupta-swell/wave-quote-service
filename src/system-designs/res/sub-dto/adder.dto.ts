import { ApiProperty } from '@nestjs/swagger';
import { QuoteDataDto } from './quote-data.dto';

class Adder {
  @ApiProperty()
  id: string;

  @ApiProperty()
  adder: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  increment: string;

  @ApiProperty()
  modifiedAt: Date;
}

export class AdderDto {
  @ApiProperty()
  adderDescription: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  adderId: string;

  @ApiProperty()
  adderModelDataSnapshot: Adder;

  @ApiProperty()
  adderModelSnapshotDate: Date;

  @ApiProperty({ type: QuoteDataDto })
  adderQuote: QuoteDataDto;
}
