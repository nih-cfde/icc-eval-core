/** array to adjacent pairs */
export const pairs = <Item>(array: Item[]): [Item, Item][] =>
  array.slice(1).map((value, index) => [array[index]!, value]);
