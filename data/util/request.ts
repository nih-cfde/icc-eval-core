import { countBy, keys } from "lodash-es";
import stripAnsi from "strip-ansi";
import { saveFile, type Filename } from "@/util/file";
import { log, progress } from "@/util/log";
import { sleep } from "@/util/misc";
import { count } from "@/util/string";

export type Params = Record<string, unknown | unknown[]>;

const { RAW_PATH } = process.env;

/** request */
type Url = string | URL;
type Options = Omit<RequestInit, "body"> & {
  params?: Params;
  body?: unknown;
  parse?: "json" | "text";
};
type Request = {
  <Parsed>(url: Url, options: Options): Promise<Parsed>;
  (url: Url, options: Options, raw: true): Promise<Response>;
};

/** generic request wrapper */
export const request: Request = async <Parsed>(
  url: Url,
  options: Options,
  /** whether to return raw response object */
  raw = false,
) => {
  /** options defaults */
  options.parse ??= "json";

  /** construct request url */
  url = new URL(url);

  /** add url params */
  for (const [key, values] of Object.entries(options.params ?? {}))
    for (const value of [values].flat())
      url.searchParams.append(key, String(value));

  /** make request */
  const request = new Request(url, {
    ...options,
    body: JSON.stringify(options.body),
  });
  let response = await fetch(request);

  /** if rate limited, retry a few times */
  let retry = 5;
  while (response.status === 429 && retry-- > 0) {
    const timeout = parseInt(response.headers.get("retry-after") ?? "1") + 1;
    console.debug(`Retrying (${retry}) after ${timeout}s`);
    await sleep(timeout * 1000);
    response = await fetch(request.clone());
  }
  if (!response.ok) throw Error(`Response for ${url} not OK`);
  if (raw) return response;

  /** parse response */
  try {
    if (options.parse === "json") return (await response.json()) as Parsed;
    if (options.parse === "text") return (await response.text()) as Parsed;
    throw Error();
  } catch (error) {
    throw Error(`Problem parsing ${url} as ${options.parse}`);
  }
};

/** is empty data result */
export const isEmpty = (data: unknown) =>
  data === undefined ||
  data === null ||
  (Array.isArray(data) && !data.length) ||
  (typeof data === "object" && !keys(data).length);

export type Progress = (progress: number) => void;

/** run task, with caching, progress logging, and error catching */
export const query = async <Result>(
  /** async func to run */
  promise: (progress: Progress) => Promise<Result>,
  /** raw filename */
  filename?: Filename,
): Promise<NonNullable<Result>> => {
  let result: Result;

  /** progress bar */
  const bar = progress(1);

  try {
    /** run promise */
    result = await promise((progress) => bar(0, progress));

    /** don't let empty be successful result */
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
    progress: Progress,
    /**
     * func to call to set label for promise (easier to identify which promise
     * caused error than array index number)
     */
    label: (value: string) => void,
  ) => Promise<Result>)[],
  /** raw (cache) filename */
  filename?: Filename,
  /** max number of concurrent queries */
  concurrency = 10,
): Promise<(NonNullable<Result> | Error)[]> => {
  /** progress bar */
  const bar = progress(promises.length);

  /** number of currently running promises */
  let running = 0;

  /** run promises */
  const settled = await Promise.allSettled(
    promises.map(async (promise, index) => {
      /** label for promise */
      let label = "";

      try {
        /** wait until # of running promises is less than limit */
        while (running >= concurrency) await sleep(10);

        /** increment running promises */
        running++;

        bar(index, "start");

        /** run promise */
        const result = await promise(
          /** update progress */
          (progress) => bar(index, progress),
          /** update label */
          (value) => (label = value),
        );

        /** don't let empty be successful result */
        if (isEmpty(result)) throw Error("No results");

        bar(index, "success");

        return result as NonNullable<Result>;
      } catch (error) {
        bar(index, "error");
        const e = error as Error;
        /** include promise label in error */
        if (label) e.message = `${label} ${e.message}`;
        throw e;
      } finally {
        /** decrement running promises */
        running--;
      }
    }),
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
    errors.map((error) => error.message.replaceAll("\n", " ")),
  );
  for (const [message, number] of Object.entries(messages))
    log(`(${count(number)}): ${stripAnsi(message)}`, "warn");
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
