import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SaveInsertionRuleReq {
  @ApiProperty()
  @IsString()
  @IsOptional()
  insertionRule?: string;
}
