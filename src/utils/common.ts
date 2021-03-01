import { isValidObjectId, Types } from 'mongoose';

export const isObjectId = (id: string) => {
  const { ObjectId } = Types;
  isValidObjectId;
  ObjectId.isValid(id);
  if (!ObjectId.isValid(id)) {
    return false;
  }
  return new ObjectId(id).toString() === id;
};

export const getBooleanString = (str: string) => {
  if (str === 'true' || str === '1') return true;
  if (str === 'false' || str === '0') return false;
  return undefined;
};
