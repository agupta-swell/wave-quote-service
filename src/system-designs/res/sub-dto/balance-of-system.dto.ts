import { ApiProperty } from '@nestjs/swagger';

export class BalanceOfSystemDto {
  @ApiProperty()
  manufacturer: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  relatedComponentCategory: string;

  @ApiProperty()
  relatedComponent: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  unitPrice: number;
}
