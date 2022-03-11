import { IUsageProfile } from './usage-profile.interface';

export interface IUsageProfileSnapshot {
  usageProfileId: string;
  usageProfileSnapshotDate: Date;
  usageProfileSnapshot: IUsageProfile;
}
