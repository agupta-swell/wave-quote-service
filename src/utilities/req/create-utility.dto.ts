import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ExposeProp } from 'src/shared/decorators';
import { ENTRY_MODE } from '../constants';
import { CostDataDto, UtilityDataReqDto } from './sub-dto';

export class CreateUtilityReqDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty({ type: UtilityDataReqDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UtilityDataReqDto)
  utilityData: UtilityDataReqDto;

  @ApiProperty({ type: CostDataDto })
  @IsNotEmpty()
  @Type(() => CostDataDto)
  costData: CostDataDto;

  @ExposeProp()
  @IsNotEmpty()
  @IsEnum(ENTRY_MODE)
  entryMode: ENTRY_MODE;
}
