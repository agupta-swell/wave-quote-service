import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class SavingsDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  year: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentUtilityBill: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  newUtilityBill: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  payment: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAndIncentives: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  annualSaving: number;
}
