import { ApiProperty } from '@nestjs/swagger';
import { INVERTER_TYPE } from '../../constants';
import { ProductDto } from './product.dto';
import { QuoteDataDto } from './quote-data.dto';

export class InverterDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: [INVERTER_TYPE.CENTRAL, INVERTER_TYPE.MICRO] })
  type: INVERTER_TYPE;

  @ApiProperty()
  solarPanelArrayId: string;

  @ApiProperty({ type: ProductDto })
  inverterModelDataSnapshot: ProductDto;

  @ApiProperty()
  inverterModelSnapshotDate: Date;

  @ApiProperty({ type: QuoteDataDto })
  inverterQuote: QuoteDataDto;
}
