export interface ICalculateSystemProduction {
  lat: number;
  lon: number;
  systemCapacity: number;
  azimuth: number;
  tilt?: number;
  losses?: number;
}

export interface ILoadServingEntity {
  lseName: string;
  lseCode: string;
  zipCode: number;
  serviceType: string;
  lseId: string;
}

export interface ITypicalUsage {
  i: number;
  v: number;
}

export interface ITypicalBaseLine {
  zipCode: number;
  buildingType: string;
  customerClass: string;
  lseName: string;
  lseId: number;
  sourceType: string;
  annualConsumption: number;
  typicalHourlyUsage: ITypicalUsage[];
  typicalMonthlyUsage: ITypicalUsage[];
}
