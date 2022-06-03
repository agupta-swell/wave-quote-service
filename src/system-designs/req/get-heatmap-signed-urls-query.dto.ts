import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { HEATMAP_MODE } from '../constants';

export class GetHeatmapSignedUrlsQueryDto {
  @ApiProperty()
  @IsEnum(HEATMAP_MODE)
  mode: HEATMAP_MODE;
}
