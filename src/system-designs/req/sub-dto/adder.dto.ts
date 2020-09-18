import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { QuoteDataDto } from './quote-data.dto';

export class AdderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  adderDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  adderId: string;

  @ApiProperty({ type: QuoteDataDto })
  adderQuote: QuoteDataDto;
}
