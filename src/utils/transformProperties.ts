const snakeToCamel = (str: string) =>
  str.toLowerCase().replace(/([-_][a-z])/g, group => group[1].toUpperCase().replace('-', ''));

const camelToUnderscore = (str: string) =>
  str
    .replace(/([A-Z])/g, '_$1')
    .split(' ')
    .join('_')
    .toLowerCase();

export const toCamelCase = (obj: Object) => {
  const newObj = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[snakeToCamel(key)] = obj[key];
    }
  }

  return newObj as any;
};

export const toSnakeCase = (obj: Object) => {
  const newObj = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[camelToUnderscore(key)] = obj[key];
    }
  }

  return newObj as any;
};
