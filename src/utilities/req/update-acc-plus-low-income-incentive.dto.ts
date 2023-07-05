import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAccPlusLowIncomeIncentiveDto {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isLowIncomeOrDac?: boolean;
}
