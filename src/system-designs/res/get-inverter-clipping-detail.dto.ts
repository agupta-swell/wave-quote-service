import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { ClippingDetailsDto, PanelAndInverterDetailDataDto } from './sub-dto';

export class GetInverterClippingDetailResDto {
  @ExposeProp({ type: PanelAndInverterDetailDataDto })
  panelAndInverterDetail: PanelAndInverterDetailDataDto;

  @ExposeProp({ type: ClippingDetailsDto })
  clippingDetails: ClippingDetailsDto;
}

export class GetInverterClippingDetailRes implements ServiceResponse<GetInverterClippingDetailResDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetInverterClippingDetailResDto })
  data: GetInverterClippingDetailResDto;
}
