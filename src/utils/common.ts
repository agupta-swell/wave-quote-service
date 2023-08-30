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

export const convertStringWithCommasToNumber = (str: string) => {
  const value = Number(str.replace(/,/g, ''));
  return Number.isNaN(value) ? 0 : value;
};

export const checkEmailsEqual = (email1, email2) => {
  // Convert both email addresses to lowercase for case-insensitive comparison
  const normalizedEmail1 = email1.toLowerCase();
  const normalizedEmail2 = email2.toLowerCase();

  // Split the email addresses into local and domain parts
  const [localPart1, domain1] = normalizedEmail1.split('@');
  const [localPart2, domain2] = normalizedEmail2.split('@');

  // Remove everything after '+' in local part (for aliasing)
  const [cleanLocalPart1, alias1] = localPart1.split('+');
  const [cleanLocalPart2, alias2] = localPart2.split('+');

  // Compare the cleaned local parts and domains
  if (cleanLocalPart1 === cleanLocalPart2 && domain1 === domain2) {
    if (alias1 === alias2) {
      return {
        areEmailsEqual: true,
        message: 'Owner and Co-Owner cannot have the same email address',
      };
    }
    return {
      areEmailsEqual: true,
      message: 'Owner and Co-Owner cannot have a matching email alias',
    };
  }
  return { areEmailsEqual: false };
};
