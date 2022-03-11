import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { UsageValue } from '.';

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

  @ApiProperty({ type: UsageValue, isArray: true, default: [{ i: 1, v: 2 }] })
  @IsNotEmpty()
  @Type(() => UsageValue)
  @ValidateNested()
  typicalMonthlyUsage: UsageValue[];
}
