import { ICreateExistingSystem } from './create-existing-system.interface';

export type UpdateExistingSystem = Omit<ICreateExistingSystem, 'opportunityId'>;
