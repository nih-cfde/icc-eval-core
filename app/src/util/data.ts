import { groupBy, map, max, min, range } from "lodash";
import type { KeysOfValue } from "@/util/types";

/** get data series over time, without gaps */
export const overTime = <Datum>(
  /** list of data to analyze */
  data: Datum[],
  /** how to get time frame */
  getTime: KeysOfValue<Datum, number> | ((d: Datum) => number),
  /** what to use as value for each distinct time */
  getValue: (d: Datum[]) => number,
  defaultFirst = 1900,
  defaultLast = 2100,
) => {
  const first = min<number>(map(data, getTime as string)) ?? defaultFirst;
  const last = max<number>(map(data, getTime as string)) ?? defaultLast;
  const perTime = groupBy(data, getTime);
  return Object.fromEntries(
    range(first, last + 1).map((time) => [time, getValue(perTime[time] ?? [])]),
  );
};
