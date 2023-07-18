import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class TokenDto {
  @ExposeProp()
  _id: string;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  note: string;
}
