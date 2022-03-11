export interface IGetSolarInfoResult {
    imageryDate: {
        year: number;
        month: number;
        day: number;
    };
    imageryQuality: string;
    imageryProcessedDate: {
        year: number;
        month: number;
        day: number;
    };
    dsmUrl: string;
    rgbUrl: string;
    maskUrl: string;
    annualFluxUrl: string;
    monthlyFluxUrl: string;
    hourlyShadeUrls: string[];
}
  