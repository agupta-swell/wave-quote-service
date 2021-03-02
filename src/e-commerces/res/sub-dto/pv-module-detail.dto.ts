import { ApiProperty } from '@nestjs/swagger';

export class PvModuleDetailDataDto {
  @ApiProperty()
  systemKw: number;

  @ApiProperty()
  percentageOfSelfPower: number;

  @ApiProperty()
  estimatedTwentyFiveYearsSavings: number;
}
