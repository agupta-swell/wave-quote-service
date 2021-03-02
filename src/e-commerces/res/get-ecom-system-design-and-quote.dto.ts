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
}

export class GetEcomSystemDesignAndQuoteRes implements ServiceResponse<GetEcomSystemDesignAndQuoteDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetEcomSystemDesignAndQuoteDto })
  data: GetEcomSystemDesignAndQuoteDto;
}
