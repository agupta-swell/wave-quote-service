import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { AddressDataDto, LoadDataDto, SystemDesignDataDto } from './sub-dto';

export class GetSavingReqDto {
  @ApiProperty({ type: AddressDataDto })
  @Type(() => AddressDataDto)
  @ValidateNested()
  addressDataDetail: AddressDataDto;

  @ApiProperty({ type: SystemDesignDataDto })
  @Type(() => SystemDesignDataDto)
  @ValidateNested()
  systemDesignDataDetail: SystemDesignDataDto;

  @ApiProperty({ type: LoadDataDto })
  @Type(() => LoadDataDto)
  @ValidateNested()
  loadDataDetail: LoadDataDto;
}
