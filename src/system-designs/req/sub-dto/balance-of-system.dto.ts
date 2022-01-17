import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class BalanceOfSystemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  balanceOfSystemId: string;
}
