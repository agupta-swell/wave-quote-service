import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BalanceOfSystemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  balanceOfSystemId: string;
}
