import { ExposeProp } from 'src/shared/decorators';


export class MountTypeDerating {
  @ExposeProp()
  name: string;

  @ExposeProp()
  derateNumber: number;

  @ExposeProp()
  percent: number;
}

export class InverterRatingClippingSystem {
  @ExposeProp()
  value: number;

  @ExposeProp()
  percent: number
}

export class ProductionDeratesDataDto {
  @ExposeProp()
  value?: string | number;

  @ExposeProp()
  subValue?: number | number[];

  @ExposeProp()
  array?: number[] | MountTypeDerating[];

  @ExposeProp()
  system?: number | InverterRatingClippingSystem;

  @ExposeProp()
  netProduction?: number;
}

export class ProductionDeratesDesignSystemDto {
  @ExposeProp()
  modules: ProductionDeratesDataDto;

  @ExposeProp()
  stcRating: ProductionDeratesDataDto;

  @ExposeProp()
  ptcRating: ProductionDeratesDataDto;

  @ExposeProp()
  rawAnnualProductivity: ProductionDeratesDataDto;

  @ExposeProp()
  rawAnnualProduction: ProductionDeratesDataDto;

  @ExposeProp()
  firstYearDegradation: ProductionDeratesDataDto;

  @ExposeProp()
  mountTypeDerating: ProductionDeratesDataDto;

  @ExposeProp()
  soilingLosses: ProductionDeratesDataDto;

  @ExposeProp()
  snowLosses: ProductionDeratesDataDto;

  @ExposeProp()
  inverterRatingClipping: ProductionDeratesDataDto;

  @ExposeProp()
  dcAcConversionLosses: ProductionDeratesDataDto;

  @ExposeProp()
  wiringLosses: ProductionDeratesDataDto;

  @ExposeProp()
  connectionLosses: ProductionDeratesDataDto;

  @ExposeProp()
  allOtherLosses: ProductionDeratesDataDto;

  @ExposeProp()
  annualProduction: ProductionDeratesDataDto;
}

