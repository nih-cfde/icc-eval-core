import { deindent, divider, indent, log, newline } from "../util/log";
import { browserInstance } from ".";
import { Funding } from "../database/schema";

export const getFundings = async (): Promise<Funding[]> => {
  const { page, browser } = await browserInstance();

  divider();
  indent();
  log("info", "Getting funding numbers");

  /** list of current and archived fundings */
  await page.goto(
    "https://commonfund.nih.gov/dataecosystem/FundingOpportunities"
  );

  /** full list of funding opportunity html/pdf docs */
  const documents = await Promise.all(
    Array.from(
      await page
        .locator(":text('archived funding opportunities') + ul > li > a")
        .all()
    ).map(async (link) => await link.getAttribute("href"))
  );

  log(
    documents.length ? "success" : "error",
    `Found ${documents.length.toLocaleString()} funding documents`
  );
  newline();

  /** full list of funding numbers */
  const fundings: Funding[] = [];

  for (const document of documents) {
    if (!document) continue;

    log("info", `Funding document ${document.split(/\/|\\/).pop()}`);
    indent();

    /** html document */
    if (document.endsWith("html")) {
      await page.goto(document);

      /** main funding number/id */
      const id = (await page.locator(".noticenum").innerText()).trim();

      /** type of funding number */
      let type: Funding["type"] = "";
      if (id.startsWith("RFA")) type = "RFA";
      if (id.startsWith("NOT")) type = "NOT";

      /** activity code */
      const activityCode = await page
        .locator(":text('activity code') + *")
        .innerText({ timeout: 100 })
        .catch(() => "");

      /** validate number */
      if (id.match(/(RFA|NOT)-RM-\d+-\d+/i)) {
        fundings.push({ id, type, activityCode });
        log("secondary", id);
      } else log("warn", `${id} does not seem like a valid funding number`);
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
