import { Types } from 'mongoose';

export function isObjectId(id: string): boolean {
  const { ObjectId } = Types;
  ObjectId.isValid(id);
  if (!ObjectId.isValid(id)) {
    return false;
  }
  return new ObjectId(id).toString() === id;
}

export function getBooleanString(str: string): boolean {
  if (str === 'true' || str === '1') return true;
  if (str === 'false' || str === '0') return false;
  return false;
}
