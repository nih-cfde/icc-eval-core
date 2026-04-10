import type { UnionToIntersection, ValueOf } from "type-fest";

/** get keys of object whose values match a certain type */
export type KeysOfValue<Obj, Value> = keyof {
  [Key in keyof Obj as Obj[Key] extends Value ? Key : never]: never;
};

/** https://stackoverflow.com/questions/52856496/typescript-object-keys-return-string */
export const getEntries = <Obj extends object>(object: Obj) =>
  Object.entries(object) as [keyof Obj, UnionToIntersection<ValueOf<Obj>>][];
