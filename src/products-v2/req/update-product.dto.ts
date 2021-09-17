import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDtoReq {
  @ApiProperty()
  insertionRule: string | null;
}
