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

export const compareIds = (id1: string | ObjectId, id2: string | ObjectId) => {
  if (typeof id1 === 'string' && typeof id2 === 'string') {
    return id1 === id2;
  }

  return id1.toString() === id2.toString();
};

export function getBooleanString(str: string): boolean {
  if (str === 'true' || str === '1') return true;
  if (str === 'false' || str === '0') return false;
  return false;
}
