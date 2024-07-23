import { existsSync, readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { uniq, uniqBy } from "lodash-es";
import type { Rank } from "@/api/scimago-journals";
import { newPage } from "@/util/browser";
import { deindent, indent, log } from "@/util/log";
import { queryMulti } from "@/util/request";

const { RAW_PATH } = process.env;

/** ranks url */
const ranksUrl = "https://www.scimagojr.com/journalrank.php";
/** raw data download text */
const downloadText = "Download data";
/** page to scrape */
const searchUrl = "https://www.scimagojr.com/journalsearch.php?q=";
/** selector to get first search result journal name */
const nameSelector = ".jrnlname";

/** increase timeout for slow scimago site */
const options = { timeout: 30 * 1000 };

/** get journal info */
export const getJournals = async (journalIds: string[]) => {
  /** de-dupe */
  journalIds = uniq(journalIds);

  const rankDataPath = `${RAW_PATH}/scimago-journals.csv`;

  /** download raw data */
  if (!existsSync(rankDataPath)) {
    try {
      log(`Downloading from ${ranksUrl}`);
      const page = await newPage();
      await page.goto(ranksUrl, options);
      /** https://playwright.dev/docs/downloads */
      const downloadPromise = page
        .waitForEvent("download", options)
        /** https://github.com/microsoft/playwright/issues/21206 */
        .catch((error) => {
          throw log(error, "warn");
        });
      await page.getByText(downloadText).click(options);
      const download = await downloadPromise;
      await download.saveAs(rankDataPath);
    } catch (error) {
      log(error, "warn");
    }
  }

  log(`Parsing CSV`);

  /** read local rank data file contents */
  const rankDataContents = (() => {
    try {
      return readFileSync(rankDataPath);
    } catch (error) {
      return "";
    }
  })();

  /** parse raw data */
  const rankData = parse(rankDataContents, {
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
  let { results: journals, errors: journalErrors } = await queryMulti(
    journalIds,
    async (journalId) => {
      /** get full journal name from abbreviated name/id via journal search */
      const page = await newPage();
      await page.goto(searchUrl + journalId.replaceAll(" ", "+"), options);
      const name = await page.locator(nameSelector).first().innerText(options);
      const rank = rankLookup[name];
      if (!rank) throw Error("No matching rank");
      return rank;
    },
    (journal) => log(journal, "start"),
    (_, result) => log(result.Title, "success"),
    (journal) => log(journal, "warn"),
    "scimago-journals",
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
