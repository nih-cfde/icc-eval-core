import { memoize } from "./../util/memoize";
import { deindent, divider, indent, log, newline } from "../util/log";
import { browserInstance } from ".";
import { Opportunity } from "../database/opportunities";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/** page to scrape */
const url = "https://commonfund.nih.gov/dataecosystem/FundingOpportunities";
/** selector to get list of links to opportunity documents */
const documentsSelector =
  ":text('archived funding opportunities') + ul > li > a";
/** selector to get activity code from html opportunity document */
const activityCodeSelector = ":text('activity code') + *";
/** regex to match opportunity number */
const numberPattern = /(((RFA|NOT)-RM-\d+-\d+)|OTA-\d+-\d+)/i;

export const getOpportunities = async (): Promise<Opportunity[]> => {
  const { page, browser } = await browserInstance();

  divider();
  indent();
  log("info", "Getting opportunity numbers");

  /** list of current and archived opportunities */
  await page.goto(url);

  /** full list of opportunity html/pdf docs */
  const documents = await Promise.all(
    Array.from(await page.locator(documentsSelector).all()).map(
      async (link) => await link.getAttribute("href")
    )
  );

  log(
    documents.length ? "success" : "error",
    `Found ${documents.length.toLocaleString()} opportunity documents`
  );
  newline();

  /** full list of opportunity numbers */
  const opportunities: Opportunity[] = [];

  /** get type of opportunity number */
  const getType = (id: string): Opportunity["type"] => {
    if (id.startsWith("RFA")) return "RFA";
    if (id.startsWith("NOT")) return "NOT";
    if (id.startsWith("OTA")) return "OTA";
    return "";
  };

  for (const document of documents) {
    if (!document) continue;

    log("info", `Opportunity document ${document.split(/\/|\\/).pop()}`);
    indent();

    /** html document */
    if (document.endsWith("html")) {
      await page.goto(document);

      /** main opportunity number */
      const id = (await page.locator(".noticenum").innerText()).trim();

      /** opportunity number type */
      const type = getType(id);

      /** activity code */
      const activityCode = await page
        .locator(activityCodeSelector)
        .innerText({ timeout: 100 })
        .catch(() => "");

      /** validate number */
      if (id.match(numberPattern)) {
        opportunities.push({ id, type, activityCode });
        log("secondary", id);
      } else log("warn", `${id} does not seem like a valid opportunity number`);
    }

    /** pdf document */
    if (document.endsWith(".pdf")) {
      /** parse pdf */
      const pdf = await getDocument(new URL(document, url).href).promise;
      const firstPage = await pdf.getPage(1);
      const text = (await firstPage.getTextContent()).items
        .map((item) => ("str" in item ? item.str : ""))
        .join("");

      /** main opportunity number */
      const id = text.match(numberPattern)?.[1] || "";

      /** opportunity number type */
      const type = getType(id);

      /** activity code */
      const activityCode = "";

      /** validate number */
      if (id) {
        opportunities.push({ id, type, activityCode });
        log("secondary", id);
      } else log("warn", "Doesn't seem to have opportunity number");
    }
    deindent();
  }

  log(
    opportunities.length ? "success" : "error",
    `Found ${opportunities.length.toLocaleString()} opportunity numbers`
  );
  deindent();
  newline();

  await browser.close();

  return opportunities;
};