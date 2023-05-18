import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class MedicalBaselineDataDto {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  hasMedicalBaseline: boolean;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  medicalBaselineAmount: number;
}
