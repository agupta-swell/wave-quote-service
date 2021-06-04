import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class FinancierDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;
}
