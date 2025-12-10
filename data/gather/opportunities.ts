import { uniq, uniqBy } from "lodash-es";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { newPage } from "@/util/browser";
import { log } from "@/util/log";
import { memoize } from "@/util/memoize";
import { filterErrors, query, queryMulti, type Progress } from "@/util/request";
import { count } from "@/util/string";

/** page to scrape */
const opportunitiesUrl =
  "https://commonfund.nih.gov/dataecosystem/FundingOpportunities";
/** selector to get list of links to present and past opportunity documents */
const documentsSelector =
  "table td:first-child > a, :text('archived funding opportunities') + ul > li > a";
/** selector to get activity code from html opportunity document */
const activityCodeSelector = ":text('activity code') + *";
/** regex to match opportunity number */
const numberPattern = /(((RFA|NOT)-RM-\d+-\d+)|OTA-\d+-\d+)/i;

/** get prefix of opportunity number */
const getPrefix = (id: string) => {
  if (id.startsWith("RFA")) return "RFA";
  if (id.startsWith("NOT")) return "NOT";
  if (id.startsWith("OTA")) return "OTA";
  return "";
};

/** get full list of opportunity html/pdf docs */
export const getDocuments = memoize(async () => {
  const page = await newPage();
  await page.goto(opportunitiesUrl);
  await page.waitForSelector(documentsSelector);
  const links = await page.locator(documentsSelector).all();
  return await Promise.all(
    links.map(async (link) => {
      const href = await link.getAttribute("href");
      if (href) return href;
      else throw Error("No href");
    }),
  );
});

/** get funding opportunity details from document */
export const getOpportunity = memoize(
  async (document: string, progress: Progress) => {
    const page = await newPage();
    progress(0.25);

    /** html document */
    if (document.endsWith(".html")) {
      await page.goto(document);
      progress(0.5);

      /** main opportunity number */
      const id = (await page.locator(".noticenum").innerText()).trim();
      progress(0.75);

      /** opportunity number prefix */
      const prefix = getPrefix(id);

      /** activity code */
      const activityCode = await page
        .locator(activityCodeSelector)
        .first()
        .innerText({ timeout: 100 })
        .catch(() => "");

      /** validate number */
      if (id.match(numberPattern)) return { id, prefix, activityCode };
      else throw Error(`${id} does not seem like a valid opportunity number`);
    }

    /** pdf document */
    if (document.endsWith(".pdf")) {
      /** parse pdf */
      const pdf = await getDocument({
        url: new URL(document, opportunitiesUrl).href,
        verbosity: 0,
      }).promise;
      progress(0.5);
      const firstPage = await pdf.getPage(1);
      const text = (await firstPage.getTextContent()).items
        .map((item) => ("str" in item ? item.str : ""))
        .join("");
      progress(0.75);

      /** main opportunity number */
      const id = text.match(numberPattern)?.[1] || "";

      /** opportunity number prefix */
      const prefix = getPrefix(id);

      /** activity code */
      const activityCode = "";

      /** validate number */
      if (id) return { id, prefix, activityCode };
      else throw Error("Doesn't seem to have opportunity number");
    }

    throw Error("Invalid document extension");
  },
);

/** get common fund funding opportunities, past and present */
export const getOpportunities = async () => {
  log(`Scraping ${opportunitiesUrl} for documents`);

  let documents = await query(getDocuments, "documents.json");

  /** de-dupe */
  documents = uniq(documents);

  log(`Parsing ${count(documents)} HTML/PDF documents for opportunities`);

  const opportunities = await queryMulti(
    documents.map(
      (document) => async (progress) => getOpportunity(document, progress),
    ),
    "opportunities.json",
    1,
  );

  /** de-dupe */
  return uniqBy(filterErrors(opportunities), (opportunity) => opportunity.id);
};
