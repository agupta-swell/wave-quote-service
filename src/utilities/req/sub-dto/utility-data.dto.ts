import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ActualUsageDto, LoadServingEntityDto, TypicalBaselineUsageDto } from '.';

class TypicalUsage {
  @ApiProperty()
  i: number;

  @ApiProperty()
  v: number;
}

export class TypicalBaselineUsageExtendDto extends TypicalBaselineUsageDto {
  @ApiProperty({ type: TypicalUsage, isArray: true })
  @Type(() => TypicalUsage)
  typicalHourlyUsage: TypicalUsage[];
}

export class UtilityDataReqDto {
  @ApiProperty({ type: LoadServingEntityDto })
  loadServingEntityData: LoadServingEntityDto;

  @ApiProperty({ type: TypicalBaselineUsageExtendDto })
  @Type(() => TypicalBaselineUsageExtendDto)
  typicalBaselineUsage: TypicalBaselineUsageExtendDto;

  @ApiProperty({ type: ActualUsageDto })
  @Type(() => ActualUsageDto)
  actualUsage: ActualUsageDto;
}
