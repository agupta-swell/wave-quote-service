import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { AddressDataDto, LoadDataDto, SystemDesignDataDto } from './sub-dto';

export class GetSavingReqDto {
  @ApiProperty({ type: AddressDataDto })
  @ValidateNested()
  addressDataDetail: AddressDataDto;

  @ApiProperty({ type: SystemDesignDataDto })
  @ValidateNested()
  systemDesignDataDetail: SystemDesignDataDto;

  @ApiProperty({ type: LoadDataDto })
  @ValidateNested()
  loadDataDetail: LoadDataDto;
}
