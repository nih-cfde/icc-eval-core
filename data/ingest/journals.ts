import { uniq, uniqBy } from "lodash-es";
import type { Rank } from "@/api/scimago-journals";
import { newPage } from "@/util/browser";
import { loadFile } from "@/util/file";
import { deindent, indent, log } from "@/util/log";
import { query, queryMulti } from "@/util/request";

/** ranks url */
const ranksUrl = "https://www.scimagojr.com/journalrank.php";
/** raw data download text */
const downloadText = "Download data";
/** page to scrape */
const searchUrl = "https://www.scimagojr.com/journalsearch.php?q=";
/** selector to get first search result journal name */
const nameSelector = ".jrnlname";

/** get journal info */
export const getJournals = async (journalIds: string[]) => {
  /** de-dupe */
  journalIds = uniq(journalIds);

  log(`Getting ${journalIds.length.toLocaleString()} journals`, "start");

  log(`Downloading from ${ranksUrl}`);

  /** get journal rank data */
  const { result: ranks = [], error: ranksError } = await query<Rank[]>(
    async () => {
      const page = await newPage();
      await page.goto(ranksUrl);
      /** https://playwright.dev/docs/downloads */
      const downloadPromise = page
        .waitForEvent("download")
        /** https://github.com/microsoft/playwright/issues/21206 */
        .catch((error) => {
          throw error;
        });
      await page.getByText(downloadText).click();
      const download = await downloadPromise;
      const ranks = await loadFile<Rank[]>(await download.path(), "csv", {
        delimiter: ";",
      });
      if (!ranks) throw Error("No ranks found");
      return ranks;
    },
    "scimago-journals.csv",
  );

  log(
    `Got ${ranks.length.toLocaleString()} journal ranks`,
    ranks.length ? "success" : "error",
  );
  if (ranksError) throw log("Error getting journal ranks", "error");

  log("Getting journal names");

  indent();

  let { results: names, errors: nameErrors } = await queryMulti(
    journalIds.map(async (id) => {
      const page = await newPage();
      await page.goto(searchUrl + id.replaceAll(" ", "+"));
      /** get full journal name from abbreviated name/id via journal search */
      const name = await page.locator(nameSelector).first().innerText();
      return { id, name };
    }),
    "scimago-journals.json",
  );
  deindent();

  /** de-dupe */
  names = uniqBy(names, "id");

  if (names.length)
    log(`Got ${names.length.toLocaleString()} names`, "success");
  if (nameErrors.length)
    log(`Problem getting ${nameErrors.length.toLocaleString()} names`, "warn");

  /** create lookups for efficiency */
  const rankLookup = Object.fromEntries(
    ranks.map((value) => [value.Title, value]),
  );
  const nameLookup = Object.fromEntries(
    names.map(({ id, name }) => [id, name]),
  );

  /** transform data into desired format, with fallbacks */
  const transformedJournals = names
    .map(({ id, name }) => ({
      id,
      name,
      rank: rankLookup[nameLookup[id] ?? ""]?.SJR ?? 0,
    }))
    .concat(
      nameErrors.map((error) => ({
        id: journalIds[error.index]!,
        name: journalIds[error.index]!,
        rank: 0,
      })),
    );

  return transformedJournals;
};
