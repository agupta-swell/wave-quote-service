import { LeanDocument, ObjectId } from 'mongoose';

export interface IDocumentWithId {
  _id: string | ObjectId;
}

export type DocumentWithCommonId<T extends IDocumentWithId | LeanDocument<any>> = { id: string } & Omit<T, '_id'>;

export type MappedId<T> = T extends IDocumentWithId
  ? DocumentWithCommonId<T>
  : T extends LeanDocument<any>
  ? DocumentWithCommonId<T>
  : T;

export const mongoIdToId = <T>(target: T): MappedId<T> => {
  if ('_id' in target) {
    const { _id, ...p } = <IDocumentWithId>(<unknown>target);
    return {
      id: _id.toString(),
      ...p,
    } as MappedId<T>;
  }

  return target as MappedId<T>;
};
