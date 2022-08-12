import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';

class UsageValue {
  @ApiProperty()
  @IsNumber()
  i: number;

  @ApiProperty()
  @IsNumber()
  v: number;
}

export class ComputedUsageDto {
  @ApiProperty()
  sourceType: string;

  @ApiProperty()
  annualConsumption: number;

  @ApiProperty({ type: UsageValue, isArray: true })
  @IsArray()
  @Type(() => UsageValue)
  @ValidateNested({ each: true })
  monthlyUsage: UsageValue[];
  
  @ApiProperty({ type: UsageValue, isArray: true })
  @IsOptional()
  @IsArray()
  @Type(() => UsageValue)
  @ValidateNested({ each: true })
  hourlyUsage?: UsageValue[];
}
