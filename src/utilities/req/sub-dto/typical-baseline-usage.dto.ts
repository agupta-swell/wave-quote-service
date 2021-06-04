import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { isNumber } from 'lodash';

class TypicalUsage {
  @ApiProperty()
  @IsNumber()
  i: number;

  @ApiProperty()
  @IsNumber()
  v: number;
}

export class TypicalBaselineUsageDto {
  @ApiProperty()
  @IsNumber()
  zipCode: number;

  @ApiProperty()
  @IsString()
  buildingType: string;

  @ApiProperty()
  @IsString()
  customerClass: string;

  @ApiProperty()
  @IsString()
  lseName: string;

  @ApiProperty()
  @IsNumber()
  lseId: number;

  @ApiProperty()
  @IsString()
  sourceType: string;

  @ApiProperty()
  @IsNumber()
  annualConsumption: number;

  @ApiProperty({ type: TypicalUsage, isArray: true, default: [{ i: 1, v: 2 }] })
  @IsNotEmpty()
  @Type(() => TypicalUsage)
  @ValidateNested()
  typicalMonthlyUsage: TypicalUsage[];
}
