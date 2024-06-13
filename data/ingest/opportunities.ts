import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Opportunity } from "@/database/opportunities";
import { browserInstance } from "@/util/browser";
import { deindent, indent, log, newline } from "@/util/log";

/** page to scrape */
const url = "https://commonfund.nih.gov/dataecosystem/FundingOpportunities";
/** selector to get list of links to present and past opportunity documents */
const documentsSelector =
  "table td:first-child > a, :text('archived funding opportunities') + ul > li > a";
/** selector to get activity code from html opportunity document */
const activity_codeSelector = ":text('activity code') + *";
/** regex to match opportunity number */
const numberPattern = /(((RFA|NOT)-RM-\d+-\d+)|OTA-\d+-\d+)/i;

/** get common fund funding opportunities, past and present */
export const getOpportunities = async (): Promise<Opportunity[]> => {
  log("Getting opportunities");

  const { page, browser } = await browserInstance();

  /** list of current and archived opportunities */
  await page.goto(url);

  /** full list of opportunity html/pdf docs */
  const documents = await Promise.all(
    Array.from(await page.locator(documentsSelector).all()).map(
      async (link) => await link.getAttribute("href"),
    ),
  );

  log(
    `Found ${documents.length.toLocaleString()} opportunity documents`,
    documents.length ? "success" : "error",
  );
  newline();

  /** full list of opportunity numbers */
  const opportunities: Opportunity[] = [];

  /** get type of opportunity number */
  const getPrefix = (id: string): Opportunity["prefix"] => {
    if (id.startsWith("RFA")) return "RFA";
    if (id.startsWith("NOT")) return "NOT";
    if (id.startsWith("OTA")) return "OTA";
    return "";
  };

  for (const document of documents) {
    if (!document) continue;

    log(`Opportunity document ${document.split(/\/|\\/).pop()}`);
    indent();

    /** html document */
    if (document.endsWith("html")) {
      await page.goto(document);

      /** main opportunity number */
      const id = (await page.locator(".noticenum").innerText()).trim();

      /** opportunity number prefix */
      const prefix = getPrefix(id);

      /** activity code */
      const activity_code = await page
        .locator(activity_codeSelector)
        .innerText({ timeout: 100 })
        .catch(() => "");

      /** validate number */
      if (id.match(numberPattern)) {
        opportunities.push({ id, prefix, activity_code });
        log(id, "secondary");
      } else log(`${id} does not seem like a valid opportunity number`, "warn");
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

      /** opportunity number prefix */
      const prefix = getPrefix(id);

      /** activity code */
      const activity_code = "";

      /** validate number */
      if (id) {
        opportunities.push({ id, prefix, activity_code });
        log(id, "secondary");
      } else log("Doesn't seem to have opportunity number", "warn");
    }
    deindent();
  }

  log(
    `Found ${opportunities.length.toLocaleString()} opportunities`,
    opportunities.length ? "success" : "error",
  );

  await browser.close();

  return opportunities;
};
