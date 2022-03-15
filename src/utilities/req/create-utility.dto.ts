import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateNested, IsMongoId, IsOptional, IsNumber } from 'class-validator';
import { Default, ExposeProp } from 'src/shared/decorators';
import { Transform, Type } from 'class-transformer';
import { IUsageProfile } from 'src/usage-profiles/interfaces';
import { ENTRY_MODE } from '../constants';
import { CostDataDto, UtilityDataReqDto } from './sub-dto';

export class CreateUtilityReqDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty({ type: UtilityDataReqDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UtilityDataReqDto)
  utilityData: UtilityDataReqDto;

  @ApiProperty({ type: CostDataDto })
  @IsNotEmpty()
  @Type(() => CostDataDto)
  costData: CostDataDto;

  @ExposeProp()
  @IsNotEmpty()
  @IsEnum(ENTRY_MODE)
  entryMode: ENTRY_MODE;

  @ApiProperty()
  @IsOptional()
  hasPoolValue: boolean;

  @Transform(({ obj }) => (obj.hasPoolValue ? 2500 : 0))
  poolValue: number;

  @IsMongoId()
  @IsOptional()
  @ApiProperty()
  usageProfileId?: string;

  usageProfileSnapshotDate?: Date;

  usageProfileSnapshot?: IUsageProfile;

  @IsNumber()
  @Default()
  increaseAmount: number;

  @IsNumber()
  @Default()
  increasePercentage: number;
}
