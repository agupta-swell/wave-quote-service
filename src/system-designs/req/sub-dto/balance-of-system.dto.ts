import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class BalanceOfSystemDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  balanceOfSystemId: string;
}
