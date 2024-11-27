import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

const { CACHE } = process.env;

/**
 * make simple persistent disk cache with function memoization and per-func ttl.
 * explored third party libraries: cacache, memoize, memoize-fs, and much more.
 * none met all requirements.
 */
export const memoize =
  <Args extends unknown[], Return>(
    func: (...args: Args) => Promise<Return>,
    options: Options = {},
  ) =>
  async (...args: Args) => {
    /** set options defaults */
    options.maxAge ??= 24 * 60 * 60;

    /** get cache key unique to function and arguments */
    const key = func.name + func.toString() + JSON.stringify(args);
    /** make shorter unique cache key */
    const hash = createHash("md5").update(key).digest("hex");
    /** possible cache hit */
    const cached = cache[hash];

    /** current timestamp */
    const now = Date.now();
    /** is cached entry expired */
    const expired = now - (cached?.timestamp ?? 0) > options.maxAge * 1000;

    /** return value */
    let result: Return;

    /** if cached value valid */
    if (CACHE && cached && !expired) {
      /** use cached value */
      result = cached.data as Return;
    } else {
      /** run function */
      result = await func(...args);
      /** set cache */
      cache[hash] = { timestamp: now, data: result };
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
const cachePath = "./raw/cache.json";

/** global in-memory cache */
let cache: Cache = {};

/** cache store */
type Cache = Record<
  string,
  {
    timestamp: number;
    data: unknown;
  }
>;

/** load disk cache into memory cache */
if (existsSync(cachePath))
  cache = JSON.parse(readFileSync(cachePath, "utf-8")) as Cache;

/** save memory cache to disk cache */
const saveCache = () => writeFileSync(cachePath, JSON.stringify(cache));
