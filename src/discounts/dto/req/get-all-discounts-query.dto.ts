import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetAllDiscountQueryDto {
  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  quoteId?: string;
}
