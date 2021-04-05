import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';

class PvDetailsData {
  @ApiProperty()
  @IsNumber()
  pvCapacity: number;

  @ApiProperty()
  @IsString()
  moduleName: string;

  @ApiProperty()
  @IsNumber()
  moduleCount: number;
}

class StorageDetailsData {
  @ApiProperty()
  @IsString()
  batteryModel: string;

  @ApiProperty()
  @IsNumber()
  batteryCount: number;
}

export class SystemDesignDataDto {
  @ApiProperty({ type: PvDetailsData })
  @ValidateNested()
  pvDetailsData: PvDetailsData;

  @ApiProperty({ type: StorageDetailsData })
  @ValidateNested()
  storageDetailsData: StorageDetailsData;

  @ApiProperty()
  @IsNumber()
  chargeFromGridMaxPercentage: number;

  @ApiProperty()
  @IsString()
  financialDict: string;

  @ApiProperty()
  @IsString()
  gridServices: string;

  @ApiProperty()
  @IsBoolean()
  sgip: boolean;

  @ApiProperty()
  @IsNumber()
  gridServicesDays: number;

  @ApiProperty()
  @IsNumber()
  exportLimit: number;
}
