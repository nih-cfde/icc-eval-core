import { uniq, uniqBy } from "lodash-es";
import type { Rank } from "@/api/scimago-ranks";
import { download, newPage } from "@/util/browser";
import { loadFile } from "@/util/file";
import { deindent, indent, log } from "@/util/log";
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

  log(`Getting ${journalIds.length.toLocaleString()} journals`, "start");

  log(`Downloading from ${ranksUrl}`);

  /** get journal rank data */
  const { result: ranks = [], error: ranksError } = await query(async () => {
    const path = await download(ranksUrl);
    return await loadFile<Rank[]>(path, "csv", { delimiter: ";" });
  }, "scimago-ranks.csv");

  log(`Got ${ranks.length.toLocaleString()} journal ranks`, "success");
  if (ranksError) throw log("Error getting journal ranks", "error");

  log("Getting journal names");

  indent();

  let { results: journals, errors: journalErrors } = await queryMulti(
    journalIds.map((id) => async () => {
      const page = await newPage();
      await page.goto(searchUrl.replace("JOURNAL", id.replaceAll(" ", "+")));
      /** get full journal name from abbreviated name/id via journal search */
      const issns = (await page.locator(issnSelector).innerText())
        .split("\n")
        .map((number) => number.replaceAll(/[^0-9]/g, ""))
        .filter(Boolean);
      return { id, issns };
    }),
    "nlm-journals.json",
  );
  deindent();

  /** de-dupe */
  journals = uniqBy(journals, "id");

  log(
    `Got ${journals.length.toLocaleString()} journals`,
    journals.length ? "success" : "error",
  );
  if (journalErrors.length)
    log(
      `Problem getting ${journalErrors.length.toLocaleString()} journals`,
      "warn",
    );

  /** transform data into desired format, with fallbacks */
  const transformedJournals = journals
    .map(({ id, issns }) => {
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
    })
    .concat(
      journalErrors.map((error) => {
        const id = journalIds[error.index]!;
        return { id, name: id, rank: 0, issns: [] };
      }),
    );

  return transformedJournals;
};
