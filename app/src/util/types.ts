/** get keys of object whose values match a certain type */
export type KeysOfValue<Data, Value> = keyof {
  [Key in keyof Data as Data[Key] extends Value ? Key : never]: never;
};

/**
 * for debugging types
 * https://stackoverflow.com/questions/57683303/how-can-i-see-the-full-expanded-contract-of-a-typescript-type
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
