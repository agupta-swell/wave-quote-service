import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ClippingDetailsDto, PanelAndInverterDetailDataDto } from './sub-dto';

export class GetInverterClippingDetailResDto {
  @ApiProperty({ type: PanelAndInverterDetailDataDto })
  panelAndInverterDetail: PanelAndInverterDetailDataDto;

  @ApiProperty({ type: ClippingDetailsDto })
  clippingDetails: ClippingDetailsDto;

  constructor(panelAndInverterDetail: PanelAndInverterDetailDataDto, clippingDetails: ClippingDetailsDto) {
    this.panelAndInverterDetail = panelAndInverterDetail;
    this.clippingDetails = clippingDetails;
  }
}

export class GetInverterClippingDetailRes implements ServiceResponse<GetInverterClippingDetailResDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetInverterClippingDetailResDto })
  data: GetInverterClippingDetailResDto;
}
