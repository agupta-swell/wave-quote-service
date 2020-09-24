import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { INVERTER_TYPE } from '../../constants';
import { QuoteDataDto } from './quote-data.dto';

export class InverterDto {
  @ApiProperty({ enum: [INVERTER_TYPE.CENTRAL, INVERTER_TYPE.MICRO] })
  @IsNotEmpty()
  type: INVERTER_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inverterModelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ type: QuoteDataDto })
  inverterQuote: QuoteDataDto;
}
