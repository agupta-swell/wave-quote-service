import { ApiProperty } from '@nestjs/swagger';

class PvPanelDetailData {
  @ApiProperty()
  numberOfPanels: number;

  @ApiProperty()
  panelSTCRating: number;
}

class InverterDetailData {
  @ApiProperty()
  numberOfInverters: number;

  @ApiProperty()
  inverterRating: number;
}

export class PanelAndInverterDetailDataDto {
  @ApiProperty({ type: PvPanelDetailData, isArray: true })
  panelsDetail: PvPanelDetailData[];

  @ApiProperty({ type: InverterDetailData, isArray: true })
  invertersDetail: InverterDetailData[];
}
