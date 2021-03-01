import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { CostDataDto, UtilityDataReqDto } from './sub-dto';

export class CreateUtilityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty({ type: () => UtilityDataReqDto })
  @Type(() => UtilityDataReqDto)
  utilityData: UtilityDataReqDto;

  @ApiProperty({ type: CostDataDto })
  @Type(() => CostDataDto)
  costData: CostDataDto;
}
