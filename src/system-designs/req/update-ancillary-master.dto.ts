import { ApiProperty } from '@nestjs/swagger';

export class UpdateAncillaryMasterDtoReq {
  @ApiProperty()
  insertionRule: string | null;
}
