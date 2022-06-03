import { ExposeProp } from 'src/shared/decorators';

export class DimensionResDto {
  @ExposeProp()
  length: number;

  @ExposeProp()
  width: number;
}
