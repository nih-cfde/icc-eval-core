import { uniq, uniqBy } from "lodash-es";
import { getFullJournalName } from "@/api/entrez";
import type { Rank } from "@/api/types/scimago-ranks";
import { downloadFile, loadFile } from "@/util/file";
import { log } from "@/util/log";
import { settled } from "@/util/misc";
import { count } from "@/util/string";

const { MANUAL_PATH } = process.env;

/** ranks data download url */
const ranksUrl = "https://www.scimagojr.com/journalrank.php?out=xls";
/** fallback manual ranks file path */
const manualRanksPath = `${MANUAL_PATH}/scimago-ranks.csv`;

/** get journal info */
export const getJournals = async (abbrevs: string[]) => {
  /** de-dupe */
  abbrevs = uniq(abbrevs);

  log(`Getting ${count(abbrevs)} journals`);

  log(`Downloading from ${ranksUrl}`);

  /** get journal rank data */
  const ranksFile = await downloadFile(ranksUrl, "scimago-ranks.csv")
    .then(({ path }) => path)
    .catch(() => manualRanksPath);
  const { data: ranks } = await loadFile<Rank[]>(ranksFile, "csv", {
    delimiter: ";",
  });

  log("Getting full journal details");

  /** look up full journal info */
  const [journals, errors] = await settled(
    abbrevs,
    (abbrev) => {
      log(abbrev, "secondary", 1);
      return getFullJournalName(abbrev);
    },
    /** avoid rate-limiting */
    1,
  );

  errors.forEach((error, index) => {
    log(abbrevs[index], "secondary", 1);
    log(error, "warn", 2);
  });

  if (errors.length) log(`${count(errors)} errors`, "error");

  /** transform data into desired format, with fallbacks */
  let transformedJournals = journals.map((journal, index) => {
    if (journal instanceof Error) {
      const abbrev = abbrevs[index]!;
      return { abbrev, name: abbrev, title: abbrev, rank: 0 };
    } else {
      /** find matching rank by issn */
      const rank = ranks.find((rank) => rank.Issn?.includes(journal.issn));
      return {
        ...journal,
        title: rank?.Title ?? journal.name,
        rank: Number(rank?.SJR?.replace(",", ".") ?? 0),
      };
    }
  });

  /** de-dupe */
  transformedJournals = uniqBy(
    transformedJournals,
    (journal) => journal.abbrev,
  );

  log(`${count(transformedJournals)} journals`, "success");

  return transformedJournals;
};

export type Journals = Awaited<ReturnType<typeof getJournals>>;
