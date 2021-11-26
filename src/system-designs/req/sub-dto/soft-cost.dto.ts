import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SoftCostDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  @IsNotEmpty()
  softCostId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
