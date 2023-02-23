import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { LatLngDto } from './lat-lng.dto';

class LatLngBoundsDto {
  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LatLngDto)
  ne: LatLngDto;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LatLngDto)
  sw: LatLngDto;
}

class PointDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  y: number;
}

class LineSegmentLengthDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  feet: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  inch: number;
}

class CanvasDto {
  @ApiProperty({ isArray: true, type: LatLngDto })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => PointDto)
  line: PointDto[];

  @ApiProperty({ isArray: true, type: LatLngDto })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => PointDto)
  arrow: PointDto[];

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LineSegmentLengthDto)
  lineSegmentLength: LineSegmentLengthDto;
}

export class RoofTopImageReqDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LatLngBoundsDto)
  latLngBounds: LatLngBoundsDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  rotationDegrees: number;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CanvasDto)
  canvas: CanvasDto;
}
