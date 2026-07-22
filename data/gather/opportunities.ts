import { uniq, uniqBy } from "lodash-es";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import manualOpportunities from "@/manual/opportunities.json";
import { newPage } from "@/util/browser";
import { log } from "@/util/log";
import { memoize } from "@/util/memoize";
import { settled } from "@/util/misc";
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
export const getOpportunity = memoize(async (document: string) => {
  const page = await newPage();

  /** html document */
  if (document.endsWith(".html")) {
    await page.goto(document);

    /** main opportunity number */
    const id = (await page.locator(".noticenum").innerText()).trim();

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
    const firstPage = await pdf.getPage(1);
    const text = (await firstPage.getTextContent()).items
      .map((item) => ("str" in item ? item.str : ""))
      .join("");

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
});

/** get common fund funding opportunities, past and present */
export const getOpportunities = async () => {
  log(`Scraping ${opportunitiesUrl} for documents`);

  /** get list of documents on funding opportunities page */
  let documents = await getDocuments();

  /** de-dupe */
  documents = uniq(documents);

  log(`Parsing ${count(documents)} documents for opportunities`);

  /** extract opportunity details from each document */
  let [opportunities, errors] = await settled(documents, getOpportunity, 1);

  opportunities.forEach((opportunity, index) => {
    log(documents[index], "secondary", 1);
    log(opportunity.id, "secondary", 2);
  });

  errors.forEach((error, index) => {
    log(documents[index], "secondary", 1);
    log(error, "warn", 2);
  });

  if (!opportunities.length) log("No opportunities found", "warn");

  log(`Including ${count(manualOpportunities)} manual opportunities`);

  /** add manually specified opportunities */
  opportunities.push(...manualOpportunities);

  manualOpportunities.forEach((opportunity) =>
    log(opportunity.id, "secondary", 1),
  );

  /** de-dupe */
  opportunities = uniqBy(opportunities, (opportunity) => opportunity.id);

  log(`${count(opportunities)} opportunities`, "success");

  return opportunities;
};
