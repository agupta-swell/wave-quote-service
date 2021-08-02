import { ExposeProp } from 'src/shared/decorators';

export class BalanceOfSystemModelDataSnapshot {
  @ExposeProp()
  name: string;

  @ExposeProp()
  price: number;

  @ExposeProp()
  type: string;

  @ExposeProp()
  sizeW: number;

  @ExposeProp()
  sizekWh: number;

  @ExposeProp()
  relatedComponent: string;

  @ExposeProp()
  manufacturerId: string;

  @ExposeProp()
  partNumber: number[];
}

export class BalanceOfSystemDto {
  @ExposeProp()
  balanceOfSystemId: string;

  @ExposeProp()
  balanceOfSystemSnapshotDate: Date;

  @ExposeProp({ type: BalanceOfSystemModelDataSnapshot })
  balanceOfSystemModelDataSnapshot: BalanceOfSystemModelDataSnapshot;
}
