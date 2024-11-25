import { uniq, uniqBy } from "lodash-es";
import { getFullJournalName } from "@/api/entrez";
import type { Rank } from "@/api/types/scimago-ranks";
import { downloadFile, loadFile } from "@/util/file";
import { log } from "@/util/log";
import { query, queryMulti } from "@/util/request";
import { count } from "@/util/string";

/** ranks data download url */
const ranksUrl = "https://www.scimagojr.com/journalrank.php?out=xls";

/** get journal info */
export const getJournals = async (journalIds: string[]) => {
  /** de-dupe */
  journalIds = uniq(journalIds);

  log(`Getting ${count(journalIds)} journals`);

  log(`Downloading from ${ranksUrl}`);

  /** get journal rank data */
  const ranks = await query(async (progress) => {
    const { path } = await downloadFile(
      ranksUrl,
      "scimago-ranks.csv",
      progress,
    );
    const { data } = await loadFile<Rank[]>(path, "csv", { delimiter: ";" });
    return data;
  }, "scimago-ranks.csv");

  log("Getting journal names");

  const journals = await queryMulti(
    journalIds.map((id) => () => getFullJournalName(id)),
    "entrez-journals.json",
    /** one at a time ends up being faster due to rate-limiting */
    1,
  );

  /** transform data into desired format, with fallbacks */
  let transformedJournals = journals.map((journal, index) => {
    if (journal instanceof Error) {
      const id = journalIds[index]!;
      return { id, name: id, rank: 0, issns: [] };
    } else {
      const { name, issn } = journal;
      /** find matching rank by issn */
      const rank = ranks.find((rank) => rank.Issn?.includes(issn));
      return {
        id: name,
        name: rank?.Title ?? name,
        rank: Number(rank?.SJR?.replace(",", ".") ?? 0),
        issn,
      };
    }
  });

  /** de-dupe */
  transformedJournals = uniqBy(transformedJournals, "id");

  return transformedJournals;
};
