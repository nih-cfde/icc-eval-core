import { loadJson, saveJson } from "@/util/file";
import { request } from "@/util/request";
import type { Params } from "@/util/request";

const { RAW_PATH } = process.env;

/**
 * https://api.reporter.nih.gov/
 *
 * https://api.reporter.nih.gov/documents/Data%20Elements%20for%20RePORTER%20Project%20API_V2.pdf
 */

const api = "https://api.reporter.nih.gov/v2/ENDPOINT/search";
const headers = new Headers();
headers.set("Accept", "application/json");
headers.set("Content-Type", "application/json");

type GeneralQuery = { limit?: number };
type GeneralResults = {
  meta: { total?: number };
  results: unknown[];
};

/** raw path */

/** run reporter query */
export const queryReporter = async <
  Query extends GeneralQuery,
  Results extends GeneralResults,
>(
  endpoint: "projects" | "publications",
  query: Query,
  params?: Params,
) => {
  /** filename for raw data */
  const filename = `reporter-${endpoint}`;

  /** if raw data already exists, return that without querying */
  const raw = await loadJson<Results>(RAW_PATH, filename);
  if (raw) return raw;

  /** max allowed page size */
  query.limit = 500;

  /** get page of results */
  const getPage = (offset = 0) =>
    request<Results>(api.replace("ENDPOINT", endpoint), {
      method: "POST",
      headers,
      body: { ...query, offset },
      params,
    });

  /** complete collection of all pages */
  const results = { meta: {}, results: [] } as unknown as Results;

  /** go through pages of results (with hard limit) */
  for (let offset = 0; offset <= 10 * query.limit; offset += query.limit) {
    /** get current page */
    const page = await getPage(offset);
    /** set meta from first page */
    if (offset === 0) results.meta = page.meta;
    /** collect this page of results */
    results.results = results.results.concat(page.results);
    /** if at end of pages, exit */
    if (offset + query.limit >= (page.meta.total ?? 0)) break;
  }

  /** save raw data */
  saveJson(results, RAW_PATH, filename);

  return results;
};
