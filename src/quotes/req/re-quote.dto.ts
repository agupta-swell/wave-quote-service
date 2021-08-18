import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ReQuoteDto {
  @ApiProperty()
  @IsMongoId()
  systemDesignId: string;
}
