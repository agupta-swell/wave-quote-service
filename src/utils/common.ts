import { Types, isValidObjectId } from 'mongoose';

export const isObjectId = (id: string) => {
  const ObjectId = Types.ObjectId;
  isValidObjectId
  ObjectId.isValid(id);
  if (!ObjectId.isValid(id)) {
    return false;
  }
  return new ObjectId(id).toString() === id;
};
