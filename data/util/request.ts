import { countBy, size, truncate } from "lodash-es";
import stripAnsi from "strip-ansi";
import { loadFile, saveFile, type Filename } from "@/util/file";
import { format, log, progress, progressMulti } from "@/util/log";

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

/** get "size" of data */
const getSize = (data: unknown) => {
  try {
    // @ts-expect-error try
    if (data.results) return size(data.results).toLocaleString();
    else throw Error();
  } catch (error) {
    try {
      // @ts-expect-error try
      return size(data).toLocaleString();
    } catch (error) {
      return "-";
    }
  }
};

/** run task, with caching and extra conveniences */
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
      log(`Using cache, ${getSize(result)} items`, "secondary");
      return result;
    }
  }

  let result: Result;

  /** status bar */
  const bar = progress();

  /** try to run async func */
  try {
    result = await promise((progress) => bar.set(progress));
    if (isEmpty(result)) throw Error("No results");
  } catch (error) {
    // bar.done();
    throw log(error, "error");
  }

  // bar.done();

  log(`Success, ${getSize(result)} items`, "success");

  /** save raw data */
  if (filename) saveFile(result, `${RAW_PATH}/${filename}`);

  return result as NonNullable<Result>;
};

/** run multiple tasks in parallel, with caching and extra conveniences */
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
      log(`Using cache, ${getSize(results)} items`, "secondary");
      return results;
    }
  }

  /** progress bar */
  const bar = progressMulti(promises.length);

  /** run promises */
  const settled = await Promise.allSettled(
    promises.map(async (promise, index) => {
      try {
        bar.set(index, 0);
        const result = await promise((progress) => bar.set(index, progress));
        if (isEmpty(result)) throw Error("No results");
        bar.set(index, "success");
        return result as NonNullable<Result>;
      } catch (error) {
        bar.set(index, "error");
        throw error;
      }
    }),
  );

  const results = settled.map((settled) =>
    settled.status === "fulfilled" ? settled.value : (settled.reason as Error),
  );

  bar.done();

  /** filter for successes */
  const successes = settled
    .filter((settled) => settled.status === "fulfilled")
    .map((success) => success.value);
  /** filter for errors */
  const errors = settled
    .filter((settled) => settled.status === "rejected")
    .map((error) => error.reason as Error);

  /** give hints of error causes */
  const messages = countBy(
    errors.map((error) =>
      truncate(error.message.replaceAll("\n", " "), { length: 80 }),
    ),
  );

  for (const [message, count] of Object.entries(messages))
    log(`(${count}) ${stripAnsi(message)}`, "secondary");

  if (errors.length)
    format(errors.length.toLocaleString() + " errors", "error");
  if (successes.length)
    format(successes.length.toLocaleString() + " successes", "success");

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
