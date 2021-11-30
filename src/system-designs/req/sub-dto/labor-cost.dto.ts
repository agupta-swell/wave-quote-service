import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class LaborCostDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  @IsNotEmpty()
  laborCostId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
