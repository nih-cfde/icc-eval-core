import { loadFile, saveFile, type Filename } from "@/util/file";
import { status } from "@/util/log";

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
    throw Error(`Couldn't parse ${url.pathname} as ${options.parse}`);
  }
};

/** run query, with caching and extra conveniences */
export const query = async <Result>(
  /** async func to run */
  promise: () => Promise<Result>,
  /** raw filename */
  filename?: Filename,
): Promise<{ result?: Result; error?: Error }> => {
  /** if raw data already exists, return that without querying */
  if (filename) {
    const raw = await loadFile<Result>(RAW_PATH, filename);
    if (raw && !NOCACHE) return { result: raw };
  }

  let result: Result;

  /** try to run async func */
  try {
    result = await promise();
  } catch (error) {
    return { error: error as Error };
  }

  /** save raw data */
  if (filename && result) saveFile(result, RAW_PATH, filename);

  return { result };
};

/** run multiple queries in parallel, with caching and extra conveniences */
export const queryMulti = async <Result>(
  /** async funcs to run */
  promises: Promise<Result>[],
  /** raw (cache) filename */
  filename?: Filename,
): Promise<{
  results: Result[];
  errors: (Error & { index: number })[];
}> => {
  /** if raw data already exists, return that without querying */
  if (filename) {
    const raw = await loadFile<Result[]>(RAW_PATH, filename);
    if (raw && !NOCACHE) return { results: raw, errors: [] };
  }

  /** status bar */
  const bar = status(promises.length);

  /** run promises */
  const settled = await Promise.allSettled(
    promises.map(async (promise, index) => {
      try {
        const result = await promise;
        bar.set(index, "success");
        return result;
      } catch (error) {
        bar.set(index, "error");
        throw error;
      }
    }),
  );

  bar.done();

  /** use flatMap to filter and map at same time with easier type safety */
  const results = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const errors = settled.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ ...(result.reason as Error), index }]
      : [],
  );

  /** save raw data */
  if (filename) saveFile(results, RAW_PATH, filename);

  return { results, errors };
};
