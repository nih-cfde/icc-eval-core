import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { uniq, uniqBy } from "lodash-es";
import type { Rank } from "@/api/scimago-journals";
import { newPage } from "@/util/browser";
import { deindent, indent, log } from "@/util/log";
import { allSettled } from "@/util/request";

const { RAW_PATH } = process.env;

/** ranks url */
const ranksUrl = "https://www.scimagojr.com/journalrank.php";
/** page to scrape */
const searchUrl = "https://www.scimagojr.com/journalsearch.php?q=";
/** selector to get first search result journal name */
const nameSelector = ".jrnlname";

/** get journal info */
export const getJournals = async (journalIds: string[]) => {
  /** de-dupe */
  journalIds = uniq(journalIds);

  log(`Downloading from ${ranksUrl}`);

  /** download raw data */
  const page = await newPage();
  await page.goto(ranksUrl);
  const downloadPromise = page.waitForEvent("download", { timeout: 30 * 1000 });
  await page.getByText("Download data").click();
  const download = await downloadPromise;
  await download.saveAs(`${RAW_PATH}/journals-scimago.csv`);

  log(`Parsing CSV`);

  /** parse raw data */
  const rankData = parse(readFileSync(await download.path()), {
    columns: true,
    delimiter: ";",
    skipEmptyLines: true,
    relaxQuotes: true,
    cast: (value) => {
      const asNumber = Number(value.replace(",", "."));
      if (Number.isNaN(asNumber)) return value;
      else return asNumber;
    },
  }) as Rank[];

  log(`Getting ${journalIds.length.toLocaleString()} journals`);

  /** convert to map for faster lookup */
  const rankLookup = Object.fromEntries(
    rankData.map((value) => [value.Title, value]),
  );

  indent();
  /** run in parallel */
  let { results: journals, errors: journalErrors } = await allSettled(
    journalIds,
    async (journalId) => {
      /** get full journal name from abbreviated name/id via journal search */
      const page = await newPage();
      await page.goto(searchUrl + journalId.replaceAll(" ", "+"));
      const name = await page.locator(nameSelector).first().innerText();
      const rank = rankLookup[name];
      if (!rank) throw Error("No matching rank");
      return rank;
    },
    (journal) => log(journal, "start"),
    (_, result) => log(result.Title, "success"),
    (journal) => log(journal, "warn"),
  );
  deindent();

  /** de-dupe */
  journals = uniqBy(journals, (journal) => journal.value.Title);

  if (journals.length)
    log(`Got ${journals.length.toLocaleString()} journals`, "success");
  if (journalErrors.length)
    log(
      `Problem getting ${journalErrors.length.toLocaleString()} journals`,
      "warn",
    );

  /** transform data into desired format, with fallbacks */
  const transformedJournals = journals
    .map(({ input, value: journal }) => ({
      id: input,
      name: journal.Title,
      rank: journal.SJR,
    }))
    .concat(
      ...journalErrors.map((value) => ({
        id: value.input,
        name: "",
        rank: 0,
      })),
    );

  return transformedJournals;
};
