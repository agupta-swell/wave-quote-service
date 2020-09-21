import { ApiProperty } from '@nestjs/swagger';

export class TariffDetailDto {
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

export class TariffDto {
  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  lseId: string;

  @ApiProperty()
  lseName: string;

  @ApiProperty()
  tariffDetails: TariffDetailDto;

  constructor(props: any) {
    this.zipCode = props.zipCode;
    this.lseId = props.lseId;
    this.lseName = props.lseName;
    this.tariffDetails = new TariffDetailDto({
      tariffCode: props.tariffCode,
      masterTariffId: props.masterTariffId,
      tariffName: props.tariffName,
    });
  }
}
