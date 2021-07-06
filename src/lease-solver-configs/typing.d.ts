export interface IGetDetail {
  tier: 'DTC' | 'TIER_1' | 'TIER_2' | 'TIER_3';
  isSolar: boolean;
  utilityProgramName: string;
  contractTerm: number;
  storageManufacturer: 'Tesla' | 'Enphase';
  storageSize: number;
  rateEscalator: number;
  capacityKW: number;
  productivity: number;
}
