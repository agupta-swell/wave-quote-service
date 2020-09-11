import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

export class TypicalUsage {
  @ApiProperty()
  @IsNotEmpty()
  i: number;

  @ApiProperty()
  @IsNotEmpty()
  v: number;
}

export class TypicalBaseLine {
  @ApiProperty()
  @IsNotEmpty()
  zipCode: number;

  @ApiProperty()
  @IsNotEmpty()
  buildingType: string;

  @ApiProperty()
  @IsNotEmpty()
  customerClass: string;

  @ApiProperty()
  @IsNotEmpty()
  lseName: string;

  @ApiProperty()
  @IsNotEmpty()
  lseId: number;

  @ApiProperty()
  @IsNotEmpty()
  sourceType: string;

  @ApiProperty()
  @IsNotEmpty()
  annualConsumption: number;

  @ApiProperty()
  @IsNotEmpty()
  typicalMonthlyUsage: TypicalUsage[];
}

export class ActualUsage {
  @ApiProperty()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  sourceType: string;

  @ApiProperty()
  @IsNotEmpty()
  annualConsumption: number;

  @ApiProperty()
  @IsNotEmpty()
  typicalMonthlyUsage: TypicalUsage[];
}

export class UpdateUsageDto {
  @ApiProperty()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty({
    type: TypicalBaseLine,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TypicalBaseLine)
  typicalBaselineUsage: TypicalBaseLine;

  @ApiProperty({
    type: ActualUsage,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ActualUsage)
  actualUsage: ActualUsage;
}
