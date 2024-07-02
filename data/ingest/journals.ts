import { uniq } from "lodash-es";
import type { Journal } from "@/database/journals";
import { browserInstance } from "@/util/browser";
import { log } from "@/util/log";
import { allSettled } from "@/util/request";

/** page to scrape */
const searchUrl = "https://www.scimagojr.com/journalsearch.php?q=";
/** selector to get first search result journal name */
const nameSelector = ".jrnlname";

/** get journal info */
export const getJournals = async (journals: string[]): Promise<Journal[]> => {
  /** de-dupe */
  journals = uniq(journals);

  const { browser, newPage } = await browserInstance(30 * 1000);

  log(`Getting ${journals.length.toLocaleString()} journals`);

  /** run in parallel */
  const { results, errors } = await allSettled(journals, async (journal) => {
    /** get full journal name from abbreviated name via journal search */
    const page = await newPage();
    await page.goto(searchUrl + journal.replaceAll(" ", "+"));
    const name = await page.locator(nameSelector).first().innerText();
    return name;
  });

  await browser.close();

  /** make map of abbreviated name to full name */
  const names: Record<string, string> = {};
  for (const result of results) names[result.input] = result.value;

  if (results.length)
    log(`Got ${results.length.toLocaleString()} journals`, "success");
  if (errors.length)
    log(`Problem getting ${errors.length.toLocaleString()} journals`, "warn");

  /** transform data into desired format, with fallbacks */
  return journals.map((journal) => ({
    id: journal,
    name: names[journal] ?? "",
  }));
};
