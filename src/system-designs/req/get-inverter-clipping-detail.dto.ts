import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class PvPanelDetailData {
  @ApiProperty()
  @IsNumber()
  numberOfPanels: number;

  @ApiProperty()
  @IsNumber()
  panelSTCRating: number;
}

export class InverterDetailData {
  @ApiProperty()
  @IsNumber()
  numberOfInverters: number;

  @ApiProperty()
  @IsNumber()
  inverterRating: number;
}

export class PanelAndInverterDetailDataDto {
  @ApiProperty({ type: PvPanelDetailData, isArray: true })
  @Type(() => PvPanelDetailData)
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  panelsDetail: PvPanelDetailData[];

  @ApiProperty({ type: InverterDetailData, isArray: true })
  @Type(() => InverterDetailData)
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  invertersDetail: InverterDetailData[];
}

export class GetInverterClippingDetailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ type: PanelAndInverterDetailDataDto })
  @Type(() => PanelAndInverterDetailDataDto)
  @ValidateNested({ each: true })
  @IsNotEmpty()
  panelAndInverterDetail: PanelAndInverterDetailDataDto;
}
