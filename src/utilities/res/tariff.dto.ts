import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';

export class TariffDetailDto {
  @ExposeProp()
  tariffCode: string;

  @ExposeProp()
  masterTariffId: string;

  @ExposeProp()
  tariffName: string;
}

export class TariffDto {
  @ExposeProp()
  zipCode: string;

  @ExposeProp()
  lseId: string;

  @ExposeProp()
  lseName: string;

  @ExposeProp({ type: TariffDetailDto })
  tariffDetails: TariffDetailDto[];
}
