import { uniq, uniqBy } from "lodash-es";
import { newPage } from "@/util/browser";
import { saveJson } from "@/util/file";
import { deindent, indent, log } from "@/util/log";
import { allSettled } from "@/util/request";

/** page to scrape */
const searchUrl = "https://www.scimagojr.com/journalsearch.php?q=";
/** selector to get first search result journal name */
const nameSelector = ".jrnlname";

/** get journal info */
export const getJournals = async (journalIds: string[]) => {
  /** de-dupe */
  journalIds = uniq(journalIds);

  log(`Getting ${journalIds.length.toLocaleString()} journals`);

  indent();
  /** run in parallel */
  let { results: journals, errors: journalErrors } = await allSettled(
    journalIds,
    async (journalId) => {
      /** get full journal name from abbreviated name via journal search */
      const page = await newPage();
      await page.goto(searchUrl + journalId.replaceAll(" ", "+"));
      const name = await page.locator(nameSelector).first().innerText();
      return name;
    },
    (journal) => log(journal, "start"),
    (_, result) => log(result, "success"),
    (journal) => log(journal, "warn"),
  );
  deindent();

  /** de-dupe */
  journals = uniqBy(journals, (journal) => journal.value);

  /** make map of abbreviated name to full name */
  const names: Record<string, string> = {};
  for (const result of journals) names[result.input] = result.value;

  if (journals.length)
    log(`Got ${journals.length.toLocaleString()} journals`, "success");
  if (journalErrors.length)
    log(
      `Problem getting ${journalErrors.length.toLocaleString()} journals`,
      "warn",
    );

  /** transform data into desired format, with fallbacks */
  const transformedJournals = journals.map(({ input, value: journal }) => ({
    id: input,
    name: journal ?? input,
  }));

  return transformedJournals;
};
