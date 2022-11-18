import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class ToolTipDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  term: string;

  @ExposeProp()
  definition: string;

  @ExposeProp()
  createdAt: Date;
}
