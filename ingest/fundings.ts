import { deindent, divider, indent, log, newline } from "../util/log";
import { browserInstance } from ".";
import { Funding } from "../database/schema";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/** page to scrape */
const url = "https://commonfund.nih.gov/dataecosystem/FundingOpportunities";
/** selector to get list of links to funding documents */
const documentsSelector =
  ":text('archived funding opportunities') + ul > li > a";
/** selector to get activity code from html funding document */
const activityCodeSelector = ":text('activity code') + *";
/** regex to match funding number */
const numberPattern = /(((RFA|NOT)-RM-\d+-\d+)|OTA-\d+-\d+)/i;

export const getFundings = async (): Promise<Funding[]> => {
  const { page, browser } = await browserInstance();

  divider();
  indent();
  log("info", "Getting funding numbers");

  /** list of current and archived fundings */
  await page.goto(url);

  /** full list of funding opportunity html/pdf docs */
  const documents = await Promise.all(
    Array.from(await page.locator(documentsSelector).all()).map(
      async (link) => await link.getAttribute("href")
    )
  );

  log(
    documents.length ? "success" : "error",
    `Found ${documents.length.toLocaleString()} funding documents`
  );
  newline();

  /** full list of funding numbers */
  const fundings: Funding[] = [];

  /** get type of funding number */
  const getType = (id: string): Funding["type"] => {
    if (id.startsWith("RFA")) return "RFA";
    if (id.startsWith("NOT")) return "NOT";
    if (id.startsWith("OTA")) return "OTA";
    return "";
  };

  for (const document of documents) {
    if (!document) continue;

    log("info", `Funding document ${document.split(/\/|\\/).pop()}`);
    indent();

    /** html document */
    if (document.endsWith("html")) {
      await page.goto(document);

      /** main funding number */
      const id = (await page.locator(".noticenum").innerText()).trim();

      /** funding number type */
      const type = getType(id);

      /** activity code */
      const activityCode = await page
        .locator(activityCodeSelector)
        .innerText({ timeout: 100 })
        .catch(() => "");

      /** validate number */
      if (id.match(numberPattern)) {
        fundings.push({ id, type, activityCode });
        log("secondary", id);
      } else log("warn", `${id} does not seem like a valid funding number`);
    }

    /** pdf document */
    if (document.endsWith(".pdf")) {
      /** parse pdf */
      const pdf = await getDocument(new URL(document, url).href).promise;
      const firstPage = await pdf.getPage(1);
      const text = (await firstPage.getTextContent()).items
        .map((item) => ("str" in item ? item.str : ""))
        .join("");

      /** main funding number */
      const id = text.match(numberPattern)?.[1] || "";

      /** funding number type */
      const type = getType(id);

      /** activity code */
      const activityCode = "";

      /** validate number */
      if (id) {
        fundings.push({ id, type, activityCode });
        log("secondary", id);
      } else log("warn", "Doesn't seem to have funding number");
    }
    deindent();
  }

  log(
    fundings.length ? "success" : "error",
    `Found ${fundings.length.toLocaleString()} funding numbers`
  );
  deindent();
  newline();

  await browser.close();

  return fundings;
};
