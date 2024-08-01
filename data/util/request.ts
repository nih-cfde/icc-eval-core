import { countBy, truncate } from "lodash-es";
import pLimit from "p-limit";
import stripAnsi from "strip-ansi";
import { loadFile, saveFile, type Filename } from "@/util/file";
import { log, progress } from "@/util/log";
import { count } from "@/util/string";

export type Params = Record<string, unknown | unknown[]>;

const { RAW_PATH, NOCACHE } = process.env;

/** generic request wrapper */
export const request = async <Response>(
  path: string | URL,
  options: Omit<RequestInit, "body"> & {
    params?: Params;
    body?: unknown;
    parse?: "json" | "text";
  },
) => {
  /** options defaults */
  options.parse ??= "json";

  /** construct request url */
  const url = new URL(path);

  /** add url params */
  for (const [key, values] of Object.entries(options.params ?? {}))
    for (const value of [values].flat())
      url.searchParams.append(key, String(value));

  /** make request */
  const request = new Request(url, {
    ...options,
    body: JSON.stringify(options.body),
  });
  const response = await fetch(request);
  if (!response.ok) throw Error(`Response for ${url.href} not OK`);

  /** parse response */
  try {
    if (options.parse === "json") return (await response.json()) as Response;
    if (options.parse === "text") return (await response.text()) as Response;
    throw Error();
  } catch (error) {
    throw Error(`Problem parsing ${url.pathname} as ${options.parse}`);
  }
};

/** is empty data result */
export const isEmpty = (data: unknown) =>
  data === undefined ||
  data === null ||
  (typeof data === "object" && !Object.keys(data).length) ||
  (Array.isArray(data) && !data.length);

/** run task, with caching, progress logging, and error catching */
export const query = async <Result>(
  /** async func to run */
  promise: (progress: (progress: number) => void) => Promise<Result>,
  /** raw filename */
  filename?: Filename,
): Promise<NonNullable<Result>> => {
  /** if raw data already exists, return that without querying */
  if (filename) {
    const result = loadFile<Result>(`${RAW_PATH}/${filename}`);
    if (result && !NOCACHE) {
      log(`Using cache, ${count(result)} items`, "secondary");
      return result;
    }
  }

  let result: Result;

  /** progress bar */
  const bar = progress(1);

  /** try to run async func */
  try {
    result = await promise((progress) => bar(0, progress));
    if (isEmpty(result)) throw Error("No results");
  } catch (error) {
    throw log(error, "error");
  }

  log(`Success, ${count(result)} items`, "success");

  /** save raw data */
  if (filename) saveFile(result, `${RAW_PATH}/${filename}`);

  return result as NonNullable<Result>;
};

/**
 * run multiple tasks in parallel, with caching, max concurrency, progress
 * logging, error catching, and formatting
 */
export const queryMulti = async <Result>(
  /** async funcs to run */
  promises: ((
    /** func to call to update progress of promise */
    progress: (progress: number) => void,
  ) => Promise<Result>)[],
  /** raw (cache) filename */
  filename?: Filename,
): Promise<(NonNullable<Result> | Error)[]> => {
  /** if raw data already exists, return that without querying */
  if (filename) {
    const results = loadFile<NonNullable<Result>[]>(`${RAW_PATH}/${filename}`);
    if (results && !NOCACHE) {
      log(`Using cache, ${count(results)} items`, "secondary");
      return results;
    }
  }

  /** progress bar */
  const bar = progress(promises.length);

  /** limit concurrent promises */
  const limiter = pLimit(10);

  /** run promises */
  const settled = await Promise.allSettled(
    promises
      .map((promise, index) => async () => {
        try {
          bar(index, "start");
          const result = await promise((progress) => bar(index, progress));
          if (isEmpty(result)) throw Error("No results");
          bar(index, "success");
          return result as NonNullable<Result>;
        } catch (error) {
          bar(index, "error");
          throw error;
        }
      })
      .map(limiter),
  );

  const results = settled.map((settled) =>
    settled.status === "fulfilled" ? settled.value : (settled.reason as Error),
  );

  /** filter for successes */
  const successes = settled
    .filter((settled) => settled.status === "fulfilled")
    .map((success) => success.value);
  /** filter for errors */
  const errors = settled
    .filter((settled) => settled.status === "rejected")
    .map((error) => error.reason as Error);

  /** logging */
  const messages = countBy(
    errors.map((error) =>
      truncate(error.message.replaceAll("\n", " "), { length: 80 }),
    ),
  );
  for (const [message, _count] of Object.entries(messages))
    log(`(${count(_count)}): ${stripAnsi(message)}`, "warn");
  if (!successes.length) throw log("No successes", "error");

  /** save raw data */
  if (filename) saveFile(filterErrors(results), `${RAW_PATH}/${filename}`);

  return results;
};

/** filter out errors */
export const filterErrors = <Result>(results: (Result | Error)[]) =>
  results.filter(
    (item): item is Exclude<typeof item, Error> => !(item instanceof Error),
  );
