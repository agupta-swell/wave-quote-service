import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class ProductionDeratesDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  amount: number;
}
