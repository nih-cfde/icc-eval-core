import { request } from "../util/request";
import type { Query } from "./reporter-query";
import type { Results } from "./reporter-results";

/** api info */
const api = "https://api.reporter.nih.gov/v2/projects/search";
const headers = new Headers();
headers.set("Accept", "application/json");
headers.set("Content-Type", "application/json");

/** run reporter query */
export const queryReporter = async (query: Query) => {
  /** max allowed page size */
  query.limit = 500;

  /** get page of results */
  const getPage = (offset = 0) =>
    request<Results>(api, {
      method: "POST",
      headers,
      body: { ...query, offset },
    });

  /** complete collection of all pages */
  const results: Results = { meta: {}, results: [] };

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

  return results;
};
