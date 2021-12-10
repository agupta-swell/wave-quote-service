import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsMongoId, IsOptional, ValidateNested } from 'class-validator';
import { SystemProductionDto } from 'src/system-designs/res/sub-dto/system-production.dto';
import { DiscountReqDto } from '../res/sub-dto/discount.dto';
import { UpdateQuoteDto } from './update-quote.dto';

class UtilityProgramDto {
  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  utilityProgramName: string;
}

export class CalculateQuoteDetailDto extends UpdateQuoteDto {
  @ApiProperty()
  @IsMongoId()
  quoteId: string;

  @ApiProperty({ type: SystemProductionDto })
  systemProduction: SystemProductionDto;

  @ApiProperty({ type: UtilityProgramDto })
  utilityProgram: UtilityProgramDto;

  @ApiProperty({ type: DiscountReqDto })
  @Type(() => DiscountReqDto)
  @ValidateNested({ each: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique<DiscountReqDto>(discount => discount.id)
  discounts?: DiscountReqDto[];
}
