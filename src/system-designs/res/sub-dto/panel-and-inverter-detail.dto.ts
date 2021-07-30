import { ExposeProp } from 'src/shared/decorators';

class PvPanelDetailData {
  @ExposeProp()
  numberOfPanels: number;

  @ExposeProp()
  panelSTCRating: number;
}

class InverterDetailData {
  @ExposeProp()
  numberOfInverters: number;

  @ExposeProp()
  inverterRating: number;
}

export class PanelAndInverterDetailDataDto {
  @ExposeProp({ type: PvPanelDetailData, isArray: true })
  panelsDetail: PvPanelDetailData[];

  @ExposeProp({ type: InverterDetailData, isArray: true })
  invertersDetail: InverterDetailData[];
}
