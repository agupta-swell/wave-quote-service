import { ExposeProp } from 'src/shared/decorators';

export class GetHeatmapSignedUrlsResDto {
  @ExposeProp()
  urls: string[];
}
