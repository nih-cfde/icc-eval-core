import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { throttle } from "lodash-es";

const { RAW_PATH } = process.env;

/**
 * make simple cache mechanism with: persistent/disk cache, func memoization,
 * per-func ttl, single cache file. explored third party libraries: cacache,
 * memoize, memoize-fs, memoizee, file-system-cache, and more. none met all
 * requirements.
 */
export const memoize =
  <Args extends unknown[], Return>(
    func: (...args: Args) => Promise<Return>,
    options: Options = {},
  ) =>
  async (...args: Args) => {
    /** set options defaults */
    options.maxAge ??= 7 * 24 * 60 * 60;

    /** get cache key unique to function and arguments */
    const key = func.name + func.toString() + JSON.stringify(args);
    /** make shorter unique cache key */
    const hash = createHash("md5").update(key).digest("hex");

    /** current timestamp */
    const now = Date.now();
    /** remove expired entry */
    if (now - (cache[hash]?.timestamp ?? 0) > options.maxAge * 1000)
      delete cache[hash];

    /** return value */
    let result: Return;

    /** cached entry */
    const { data, error } = cache[hash] ?? {};

    if (data !== undefined) {
      /** use cached data value */
      result = data as Return;
    } else if (error !== undefined) {
      /** use cached error value */
      throw Error(error);
    } else {
      try {
        /** run function */
        result = await func(...args);
        /** set cache data value */
        cache[hash] = { timestamp: now, data: result };
      } catch (error) {
        /** set cache error value */
        cache[hash] = {
          timestamp: now,
          error: error instanceof Error ? error.message : String(error),
        };
        throw error;
      }
    }

    /** update cache */
    saveCache();

    return result;
  };

type Options = {
  /** ttl (in seconds) */
  maxAge?: number;
};

/** on-disk cache */
const cachePath = `${RAW_PATH}/cache.json`;

/** global in-memory cache */
let cache: Cache = {};

/** cache store */
type Cache = Record<
  string,
  {
    timestamp: number;
    data?: unknown;
    error?: string;
  }
>;

/** load disk cache into memory cache */
if (existsSync(cachePath))
  cache = JSON.parse(readFileSync(cachePath, "utf-8")) as Cache;

/** save memory cache to disk cache */
const saveCache = throttle(() => {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      return writeFileSync(cachePath, JSON.stringify(cache));
    } catch {
      /** remove oldest entry and retry */
      const oldest = Object.keys(cache)[0];
      if (!oldest) return;
      delete cache[oldest];
    }
  }
}, 10000);
