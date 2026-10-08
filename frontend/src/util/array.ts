/** remove entries from middle of array to limit array length */
export const carve = (array: string[], limit: number) => {
  const reduce = array.length - limit;
  if (reduce <= 0) return array;
  const start = Math.ceil(array.length / 2 - reduce / 2);
  const end = Math.ceil(array.length / 2 + reduce / 2);
  return array
    .slice(0, start)
    .concat([`...${reduce} more...`])
    .concat(array.slice(end));
};

/** limit array to length, add ellipsis if needed */
export const limit = (array: string[], limit: number) =>
  array.length <= limit ? array : array.slice(0, limit - 1).concat(["..."]);

/** median of values */
export const median = (array: number[]) => {
  if (!array.length) return 0;
  const mid = Math.floor(array.length / 2);
  const sorted = [...array].sort((a, b) => a - b);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid];
};
