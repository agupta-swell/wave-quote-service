import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';

export class UsageValue {
  @ApiProperty()
  @IsNumber()
  i: number;

  @ApiProperty()
  @IsNumber()
  v: number;
}

export class ActualUsageDto {
  @ApiProperty()
  sourceType: string;

  @ApiProperty()
  annualConsumption: number;

  @ApiProperty({ type: UsageValue, isArray: true })
  @IsArray()
  @Type(() => UsageValue)
  @ValidateNested({ each: true })
  monthlyUsage: UsageValue[];
}
