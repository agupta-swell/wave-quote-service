import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';

class TypicalUsage {
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

  @ApiProperty({ type: TypicalUsage, isArray: true })
  @IsArray()
  @Type(() => TypicalUsage)
  @ValidateNested({ each: true })
  monthlyUsage: TypicalUsage[];
}
