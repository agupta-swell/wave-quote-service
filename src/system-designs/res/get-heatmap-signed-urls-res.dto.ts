import { ExposeProp } from 'src/shared/decorators';

export class GetHeatmapSignedUrlsResDto {
  @ExposeProp()
  noHeatmapUrls: string[];

  @ExposeProp()
  heatmapAnnualUrls: string[];

  @ExposeProp()
  heatmapsMonthlyUrls: string[];

  @ExposeProp()
  fullHeatmapAnnualUrls: string[];

  @ExposeProp()
  fullHeatmapsMonthlyUrls: string[];

  @ExposeProp()
  rooftopMarkUrls: string[];
}
