import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Location, Polygon } from './create-quoting.dto';

export class UpdateQuotingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: Location })
  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  location: Location;

  @ApiPropertyOptional({ type: Polygon, isArray: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Polygon)
  polygons: Polygon[];
}
