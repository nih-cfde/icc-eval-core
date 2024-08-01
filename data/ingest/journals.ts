import { uniq, uniqBy } from "lodash-es";
import type { Rank } from "@/api/scimago-ranks";
import { newPage } from "@/util/browser";
import { downloadFile, loadFile } from "@/util/file";
import { log } from "@/util/log";
import { query, queryMulti } from "@/util/request";

/** ranks data download url */
const ranksUrl = "https://www.scimagojr.com/journalrank.php?out=xls";
/** full journal name search */
const searchUrl =
  "https://www.ncbi.nlm.nih.gov/nlmcatalog/?term=JOURNAL%5BTA%5D";
/** locator for issns */
const issnSelector = `dt:text("ISSN:") + dd`;

/** get journal info */
export const getJournals = async (journalIds: string[]) => {
  /** de-dupe */
  journalIds = uniq(journalIds);

  log(`Getting ${journalIds.length.toLocaleString()} journals`);

  log(`Downloading from ${ranksUrl}`);

  /** get journal rank data */
  const ranks = await query(async (progress) => {
    const path = await downloadFile(ranksUrl, "scimago-ranks.csv", progress);
    return await loadFile<Rank[]>(path, "csv", { delimiter: ";" });
  }, "scimago-ranks.csv");

  log("Getting journal names");

  const journals = await queryMulti(
    journalIds.map((id) => async (progress) => {
      const page = await newPage();
      progress(0.33);
      await page.goto(searchUrl.replace("JOURNAL", id.replaceAll(" ", "+")));
      progress(0.66);
      /** get full journal name from abbreviated name/id via journal search */
      const issns = (await page.locator(issnSelector).innerText())
        .split("\n")
        .map((number) => number.replaceAll(/[^0-9]/g, ""))
        .filter(Boolean);
      return { id, issns };
    }),
    "nlm-journals.json",
  );

  /** transform data into desired format, with fallbacks */
  let transformedJournals = journals.map((journal, index) => {
    if (journal instanceof Error) {
      const id = journalIds[index]!;
      return { id, name: id, rank: 0, issns: [] };
    } else {
      const { id, issns } = journal;
      /** find matching rank by issn */
      const rank = ranks.find((rank) =>
        issns.some((issn) => rank.Issn?.includes(issn)),
      );
      return {
        id,
        name: rank?.Title ?? id,
        rank: Number(rank?.SJR?.replace(",", ".") ?? 0),
        issns,
      };
    }
  });

  /** de-dupe */
  transformedJournals = uniqBy(transformedJournals, "id");

  return transformedJournals;
};
