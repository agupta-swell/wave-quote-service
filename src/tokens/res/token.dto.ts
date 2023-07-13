import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class TokenDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  note: string;
}