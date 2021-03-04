import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { CostDetailDataDto, PaymentOptionDataDto, PvModuleDetailDataDto, StorageSystemDetailDataDto } from './sub-dto';

export class GetEcomSystemDesignAndQuoteDto {
  @ApiProperty({ type: PvModuleDetailDataDto })
  pvModuleDetailData: PvModuleDetailDataDto;

  @ApiProperty({ type: StorageSystemDetailDataDto })
  storageSystemDetailData: StorageSystemDetailDataDto;

  @ApiProperty({ type: CostDetailDataDto, isArray: true })
  costDetailsData: CostDetailDataDto[];

  @ApiProperty({ type: PaymentOptionDataDto, isArray: true })
  paymentOptionData: PaymentOptionDataDto[];

  constructor() {
    this.pvModuleDetailData = {
      systemKW: 0,
      percentageOfSelfPower: 0,
      estimatedTwentyFiveYearsSavings: 0,
    };
    this.storageSystemDetailData = {
      storageSystemCount: 0,
      storageSystemKWh: 0,
      numberOfDaysBackup: 0,
      backupDetailsTest: '',
    };
    this.costDetailsData = [];
    this.paymentOptionData = [];
  }
}

export class GetEcomSystemDesignAndQuoteRes implements ServiceResponse<GetEcomSystemDesignAndQuoteDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetEcomSystemDesignAndQuoteDto })
  data: GetEcomSystemDesignAndQuoteDto;
}
