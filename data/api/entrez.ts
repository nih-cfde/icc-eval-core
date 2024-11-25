import { request } from "@/util/request";
import type { EsearchResults, EsummaryResults } from "./types/entrez";

const esearch = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const esummary = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

const { AUTH_ENTREZ = "" } = process.env;

/** get full journal name from abbreviated name */
export const getFullJournalName = async (abbreviated: string) => {
  /** https://stackoverflow.com/questions/75512796/how-do-i-get-issns-and-full-journal-names-from-a-list-of-abbreviated-journal-nam */

  try {
    /** common params */
    const params = { retmode: "json", db: "pubmed", api_key: AUTH_ENTREZ };
    /** get papers associated with journal abbreviation */
    const searchResults = await request<EsearchResults>(esearch, {
      params: { ...params, term: `${abbreviated}[TA]` },
    });
    /** get first paper id */
    const id = searchResults.esearchresult.idlist[0] ?? "";
    /** look up full paper details */
    const summaryResults = await request<EsummaryResults>(esummary, {
      params: { ...params, id },
    });
    /** get full journal name */
    const name = summaryResults.result?.[id]?.fulljournalname ?? "";
    /** get issn */
    const issn = summaryResults.result?.[id]?.essn?.replaceAll("-", "") ?? "";

    return { name, issn };
  } catch (error) {
    console.error(error);
  }
};
