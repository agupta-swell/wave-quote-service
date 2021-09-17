import { ExposeProp } from 'src/shared/decorators';

export class DimensionResDto {
  @ExposeProp()
  length: Number;

  @ExposeProp()
  width: Number;
}
