import { LeanDocument } from 'mongoose';
import { SoftPartial } from './strict-plain-to-class';

/**
 * Assign partial POJO document to existed mongoose model
 * @param model
 * @param doc
 */
export const assignToModel = <T>(model: T, doc?: SoftPartial<LeanDocument<T>>) => {
  if (doc)
    Object.entries(doc).forEach(([key, value]) => {
      model[key] = value;
    });
};
