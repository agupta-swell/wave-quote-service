import { ApiProperty } from '@nestjs/swagger';

export class PvModuleDetailDataDto {
  @ApiProperty()
  systemKW: number;

  @ApiProperty()
  percentageOfSelfPower: number;

  @ApiProperty()
  estimatedTwentyFiveYearsSavings: number;
}
