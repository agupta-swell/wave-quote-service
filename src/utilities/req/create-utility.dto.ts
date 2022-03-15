import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested, IsMongoId, IsOptional, IsInt, IsNumber } from 'class-validator';
import { Default, ExposeProp } from 'src/shared/decorators';
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
