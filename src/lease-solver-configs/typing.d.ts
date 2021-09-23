import { Account } from 'src/accounts/account.schema';

export interface IGetDetail {
  tier: Account.Tier;
  isSolar: boolean;
  utilityProgramName: string;
  contractTerm: number;
  storageManufacturer: string;
  storageSize: number;
  rateEscalator: number;
  capacityKW: number;
  productivity: number;
}
