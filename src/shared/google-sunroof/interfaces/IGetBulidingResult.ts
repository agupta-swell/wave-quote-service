export interface ICoordinate {
  latitude: number;
  longitude: number;
}

export interface IBoundingBox {
  sw: ICoordinate;
  ne: ICoordinate;
}

interface IRoofSegmentStat {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  center: ICoordinate;
  boundingBox: {
    sw: ICoordinate;
    ne: ICoordinate;
  };
  planeHeightAtCenterMeters: number;
}
interface IRoofSegmentSummary {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

interface ISolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: IRoofSegmentSummary[];
}

interface IMonthlyBill {
  currencyCode: string;
  unit: string;
}

interface IFinancialDetail {
  initialAcKwhPerYear: number;
  remainingLifetimeUtilityBill: IMonthlyBill;
  federalIncentive: IMonthlyBill;
  stateIncentive: Pick<IMonthlyBill, 'currencyCode'>;
  utilityIncentive: Pick<IMonthlyBill, 'currencyCode'>;
  lifetimeSrecTotal: Pick<IMonthlyBill, 'currencyCode'>;
  costOfElectricityWithoutSolar: IMonthlyBill;
  netMeteringAllowed: boolean;
  solarPercentage: number;
}

// TODO
interface IFinancialAnalyst {
  monthlyBill: IMonthlyBill;
  panelConfigIndex: number;
}

interface ISolarPanel {
  center: ICoordinate;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

// TODO fulfill type
export interface IGetBuildingResult {
  name: string;
  center: ICoordinate;
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    wholeRoofStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    roofSegmentStats: IRoofSegmentStat[];
    solarPanelConfigs: ISolarPanelConfig[];
    financialAnalyses: IFinancialAnalyst[];
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    buildingStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    solarPanels: ISolarPanel[];
  };

  boundingBox: {
    sw: ICoordinate;
    ne: ICoordinate;
  };
  imageryQuality: string;
  imageryProcessedDate: {
    year: number;
    month: number;
    day: number;
  };
}
