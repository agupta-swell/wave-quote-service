import { ExposeProp } from 'src/shared/decorators';

export class sunroofDriftCorrectionResDto {
  @ExposeProp()
  x: number;

  @ExposeProp()
  y: number;
}
