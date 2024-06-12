import { chunk, isEmpty } from "lodash-es";
import type { IciteResults } from "@/api/icite-results";
import { request } from "@/util/request";

const api = "https://icite.od.nih.gov/api/pubs";

/**
 * https://icite.od.nih.gov/api
 *
 * https://www.ncbi.nlm.nih.gov/pmc/tools/cites-citedby/
 * https://www.ncbi.nlm.nih.gov/books/NBK25500/
 */

/** run icite query */
export const queryIcite = async (pmids: number[]) => {
  /** break ids into chunks of max allowed size */
  const chunks = chunk(pmids, 1000);

  /** complete collection of all chunks */
  const results = { meta: {}, data: [] } as unknown as IciteResults;

  /** go through all chunks */
  for (const chunk of chunks) {
    const { meta, data } = await request<IciteResults>(api, {
      params: { pmids: chunk.join(",") },
    });
    /** set meta from first chunk */
    if (isEmpty(meta)) results.meta = meta;
    /** collect this chunk of results */
    results.data = results.data.concat(data);
  }

  return results;
};
