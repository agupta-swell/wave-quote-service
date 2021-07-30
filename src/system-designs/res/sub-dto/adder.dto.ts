import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

class Adder {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  adder: string;

  @ExposeProp()
  price: number;

  @ExposeProp()
  increment: string;

  @ExposeProp()
  modifiedAt: Date;
}

export class AdderDto {
  @ExposeProp()
  adderDescription: string;

  @ExposeProp()
  quantity: number;

  @ExposeProp()
  adderId: string;

  @ExposeProp()
  adderModelDataSnapshot: Adder;

  @ExposeProp()
  adderModelSnapshotDate: Date;
}
