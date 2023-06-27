export const getFunctionParams = (func): string[] => {
  const rawResult = func
    .toString()
    .replace(/[/][/].*$/gm, '') // strip single-line comments
    .replace(/\s+/g, '') // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
    .split('){', 1)[0]
    .replace(/^[^(]*[(]/, '') // extract the parameters
    .replace(/=[^,]+/g, '') // strip any ES6 defaults
    .split(/(?={)|}|(?=,\[)|\]/) // handle destructuring
    .filter(Boolean); // split & filter [""]

  let result: string[] = [];
  for (let i = 0; i < rawResult.length; i += 1) {
    if (!rawResult[i].includes('{') && !rawResult[i].includes('[')) {
      result = result.concat(rawResult[i].split(',').filter(Boolean));
    } else {
      result = result.concat(rawResult[i]);
    }
  }

  return result;
};
