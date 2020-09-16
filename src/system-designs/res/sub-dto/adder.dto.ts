import { ApiProperty } from '@nestjs/swagger';

class Adder {
  @ApiProperty()
  id: string;

  @ApiProperty()
  adder: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  increment: string;

  @ApiProperty()
  modifiedAt: Date;
}

export class AdderDto {
  @ApiProperty()
  adderDescription: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  adderId: string;

  @ApiProperty()
  adders: Adder[];

  @ApiProperty()
  adderModelSnapshotDate: Date;
}
