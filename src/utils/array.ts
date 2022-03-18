/* eslint-disable no-plusplus */
export const sliceBySizesMap = <T>(arr: T[], sizes: number[]): T[][] => {
  const res: T[][] = [];
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const from = i * size;
    const to = from + size;

    const chunk = arr.slice(from, to);

    if (!chunk.length) {
      for (let j = i; j < sizes.length; j++) {
        res[j] = [];
      }
      break;
    }

    res[i] = chunk;
  }
  return res;
};

export const sliceBySize = <T>(arr: T[], size: number): T[][] => {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    if (!chunk.length) {
      break;
    }
    res.push(chunk);
  }
  return res;
};
