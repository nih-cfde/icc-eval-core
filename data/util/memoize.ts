import { createHash } from "crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";

const { RAW_PATH } = process.env;

/** cache folder */
const cache = `${RAW_PATH}/cache`;

/** make folders if needed */
mkdirSync(cache, { recursive: true });

/** persistent func memoization with per-entry files on disk */
export const memoize =
  <Args extends unknown[], Return>(
    func: (...args: Args) => Promise<Return>,
    options: Options = {},
  ) =>
  async (...args: Args) => {
    /** set default options */
    options.maxAge ??= 1 * 24 * 60 * 60;

    /** current timestamp */
    const now = Date.now();

    /** func properties */
    const name = func.name || "anonymous";
    const params = stringify(args);
    const body = func.toString() || "";
    /** hash of properties */
    const hash = createHash("md5")
      .update(name + params + body)
      .digest("hex");

    /** specific cache file for this func */
    const path = `${cache}/${hash}.json`;

    /** get cached value */
    const cached = readCache<Return>(path);

    /** cached value */
    if (cached) {
      /** remove stale */
      if (now - cached.timestamp > options.maxAge * 1000) deleteCache(path);
      else {
        /** return cached data */
        if (cached.data !== undefined) return cached.data;
        /** throw cached error */
        if (cached.error !== undefined) throw Error(cached.error);
      }
    }

    try {
      /** execute func */
      const result = await func(...args);
      /** write successful data */
      writeCache(path, { timestamp: now, name, params, body, data: result });
      return result;
    } catch (error) {
      /** write error */
      writeCache(path, {
        timestamp: now,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

type Options = {
  /** ttl (in seconds) */
  maxAge?: number;
};

type Entry<Data = unknown> = {
  timestamp: number;
  name?: string;
  params?: string;
  body?: string;
  data?: Data;
  error?: string;
};

/** read from cache file */
const readCache = <Data>(path: string): Entry<Data> | undefined => {
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as Entry<Data>;
  } catch {
    return undefined;
  }
};

/** write to cache file */
const writeCache = (path: string, entry: Entry) => {
  try {
    writeFileSync(path, JSON.stringify(entry));
  } catch {
    /** skip caching and allow func to run as normal */
  }
};

/** delete cache file */
const deleteCache = (path: string) => {
  try {
    rmSync(path, { force: true });
  } catch {
    /** ignore error */
  }
};

/** safely stringify */
const stringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable-args]";
  }
};
