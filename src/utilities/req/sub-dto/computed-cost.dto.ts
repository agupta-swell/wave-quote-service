import { ApiProperty } from '@nestjs/swagger';

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
  cost: CostDetailData[];
}

export class CostDataDto {
  @ApiProperty()
  masterTariffId: string;

  @ApiProperty({ type: UtilityCostData })
  typicalUsageCost: UtilityCostData;

  @ApiProperty({ type: UtilityCostData })
  actualUsageCost: UtilityCostData;

  @ApiProperty()
  postInstallMasterTariffId: string;
}
