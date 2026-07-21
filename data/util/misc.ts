import { availableParallelism as cores } from "os";
import pSettle, { isFulfilled, isRejected } from "p-settle";

/** wait */
export const sleep = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** settle group of promises, with max concurrency */
export const settled = async <Value, Result>(
  items: Value[],
  mapper: (item: Value, index: number) => Result,
  concurrency = cores(),
) => {
  const results = await pSettle(items, { mapper, concurrency });
  const successes = results.filter(isFulfilled).map(({ value }) => value);
  const errors = results.filter(isRejected).map(({ reason }) => reason);
  return [successes, errors] as const;
};
