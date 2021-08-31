import { Types, ObjectId } from 'mongoose';

export function isObjectId(id: string): boolean {
  const { ObjectId } = Types;
  ObjectId.isValid(id);
  if (!ObjectId.isValid(id)) {
    return false;
  }
  return new ObjectId(id).toString() === id;
}

export const transformToValidId = (str: string) => {
  const { ObjectId } = Types;
  try {
    return new ObjectId(str);
  } catch (_) {
    return str;
  }
};

/**
 *
 * Compare 2 ids of type string or ObjectId
 *
 * @param id1 string | ObjectId
 * @param id2 string | ObjectId
 * @returns
 *
 * Ex: compareIds(ObjectId("5fd1b93f8214d6f11bbad08b"), 5fd1b93f8214d6f11bbad08b) return true.
 *
 */
export const compareIds = (id1: string | Types.ObjectId, id2: string | Types.ObjectId) =>
  id1.toString() === id2.toString();

export function getBooleanString(str: string): boolean {
  if (str === 'true' || str === '1') return true;
  if (str === 'false' || str === '0') return false;
  return false;
}
