import { availableParallelism } from "os";
import { clamp } from "lodash-es";
import pSettle, { isFulfilled, isRejected } from "p-settle";
import { log } from "@/util/log";
import { count } from "@/util/string";

/** cpu utilization */
const cores = availableParallelism();
const defaultConcurrency = clamp(Math.ceil(cores / 2), 1, 24);

/** wait */
export const sleep = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** settle group of promises, with max concurrency */
export const settled = async <Value, Result>(
  items: Value[],
  mapper: (item: Value, index: number) => Result,
  concurrency = defaultConcurrency,
) => {
  log(
    `${count(items.length)} items, ${count(concurrency)} concurrency, ${count(cores)} cores`,
    "secondary",
    1,
  );
  const results = await pSettle(items, { mapper, concurrency });
  const successes = results.filter(isFulfilled).map(({ value }) => value);
  const errors = results.filter(isRejected).map(({ reason }) => reason);
  return [successes, errors] as const;
};
