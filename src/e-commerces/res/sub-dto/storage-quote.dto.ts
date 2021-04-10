import { ApiProperty } from '@nestjs/swagger';
import { CostDetailDataDto, PaymentOptionDataDto, StorageSystemDetailDataDto } from '.';

export class StorageQuoteDto {
  @ApiProperty({ type: StorageSystemDetailDataDto })
  storageSystemDetailData: StorageSystemDetailDataDto;

  @ApiProperty({ type: CostDetailDataDto, isArray: true })
  costDetailsData: CostDetailDataDto[];

  @ApiProperty({ type: PaymentOptionDataDto, isArray: true })
  paymentOptionData: PaymentOptionDataDto[];
}
