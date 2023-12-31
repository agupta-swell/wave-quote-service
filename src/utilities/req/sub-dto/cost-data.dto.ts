import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

class CostDetailData {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  i: number;

  @ApiProperty()
  v: number;
}

class UtilityCostData {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  interval: string;

  @ApiProperty({ type: CostDetailData, isArray: true })
  @IsOptional()
  cost?: CostDetailData[];

  @ApiProperty()
  annualCost: number;
}

export class CostDataDto {
  @ApiProperty()
  masterTariffId: string;

  @ApiProperty({ type: UtilityCostData })
  typicalUsageCost: UtilityCostData;

  @ApiProperty({ type: UtilityCostData })
  actualUsageCost: UtilityCostData;

  @ApiProperty({ type: UtilityCostData })
  computedCost: UtilityCostData;

  @ApiProperty()
  postInstallMasterTariffId: string;
}
