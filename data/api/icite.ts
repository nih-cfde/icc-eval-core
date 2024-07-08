import { chunk, isEmpty } from "lodash-es";
import type { Results } from "@/api/icite-results";
import { loadJson, saveJson } from "@/util/file";
import { request } from "@/util/request";

const { RAW_PATH } = process.env;

const api = "https://icite.od.nih.gov/api/pubs";

/**
 * https://icite.od.nih.gov/api
 *
 * https://www.ncbi.nlm.nih.gov/pmc/tools/cites-citedby/
 * https://www.ncbi.nlm.nih.gov/books/NBK25500/
 */

/** run icite query */
export const queryIcite = async (pmids: number[]) => {
  /** filename for raw data */
  const filename = "icite";

  /** if raw data already exists, return that without querying */
  const raw = await loadJson<Results>(RAW_PATH, filename);
  if (raw) return raw;

  /** break ids into chunks of max allowed size */
  const chunks = chunk(pmids, 1000);

  /** complete collection of all chunks */
  const results = { meta: {}, data: [] } as unknown as Results;

  /** go through all chunks */
  for (const chunk of chunks) {
    const { meta, data } = await request<Results>(api, {
      params: { pmids: chunk.join(",") },
    });
    /** set meta from first chunk */
    if (isEmpty(meta)) results.meta = meta;
    /** collect this chunk of results */
    results.data = results.data.concat(data);
  }

  /** save raw data */
  saveJson(results, RAW_PATH, filename);

  return results;
};
