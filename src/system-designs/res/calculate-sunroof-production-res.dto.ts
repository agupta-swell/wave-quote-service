import { ExposeProp } from 'src/shared/decorators';
import { ArrayProduction, SystemProduction } from 'src/shared/google-sunroof/types';

export class CalculateSunroofProductionResDto implements SystemProduction {
  @ExposeProp()
  annualProduction: number;

  @ExposeProp()
  monthlyProduction: number[];

  @ExposeProp()
  byArray: ArrayProduction[];
}
