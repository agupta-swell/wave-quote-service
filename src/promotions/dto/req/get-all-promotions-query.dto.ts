import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetAllPromotionsQueryDto {
  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  quoteId?: string;
}
