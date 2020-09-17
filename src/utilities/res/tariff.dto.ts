import { ApiProperty } from '@nestjs/swagger';

export class TariffDto {
  @ApiProperty()
  tariffCode: string;

  @ApiProperty()
  masterTariffId: string;

  @ApiProperty()
  tariffName: string;

  constructor(props: any) {
    this.tariffCode = props.tariffCode;
    this.masterTariffId = props.masterTariffId;
    this.tariffName = props.tariffName;
  }
}
