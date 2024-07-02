import { uniq, uniqBy } from "lodash-es";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { newPage } from "@/util/browser";
import { saveJson } from "@/util/file";
import { deindent, indent, log } from "@/util/log";
import { allSettled } from "@/util/request";

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

/** get common fund funding opportunities, past and present */
export const getOpportunities = async () => {
  log(`Scraping ${opportunitiesUrl}`, "start");

  /** list of current and archived opportunities */
  const page = await newPage();
  await page.goto(opportunitiesUrl);

  /** full list of opportunity html/pdf docs */
  let { results: documents } = await allSettled(
    Array.from(await page.locator(documentsSelector).all()),
    async (link) => {
      const href = await link.getAttribute("href");
      if (href) return href;
      else throw Error("No href");
    },
  );

  /** de-dupe */
  documents = uniq(documents);

  log(
    `Found ${documents.length.toLocaleString()} opportunity documents`,
    documents.length ? "success" : "error",
  );

  /** get prefix of opportunity number */
  const getPrefix = (id: string) => {
    if (id.startsWith("RFA")) return "RFA";
    if (id.startsWith("NOT")) return "NOT";
    if (id.startsWith("OTA")) return "OTA";
    return "";
  };

  indent();
  /** run in parallel */
  let { results: opportunities, errors: opportunityErrors } = await allSettled(
    documents.map((document) => document.value),
    async (document) => {
      const page = await newPage();

      /** html document */
      if (document.endsWith(".html")) {
        await page.goto(document);

        /** main opportunity number */
        const id = (await page.locator(".noticenum").innerText()).trim();

        /** opportunity number prefix */
        const prefix = getPrefix(id);

        /** activity code */
        const activity_code = await page
          .locator(activityCodeSelector)
          .first()
          .innerText({ timeout: 100 })
          .catch(() => "");

        /** validate number */
        if (id.match(numberPattern)) return { id, prefix, activity_code };
        else throw Error(`${id} does not seem like a valid opportunity number`);
      }

      /** pdf document */
      if (document.endsWith(".pdf")) {
        /** parse pdf */
        const pdf = await getDocument(new URL(document, opportunitiesUrl).href)
          .promise;
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
        if (id) return { id, prefix, activity_code };
        else throw Error("Doesn't seem to have opportunity number");
      }

      throw Error("Invalid document extension");
    },
    (document) => log(document, "start"),
    (_, result) => log(result.id, "success"),
    (document) => log(document, "warn"),
  );
  deindent();

  /** de-dupe */
  opportunities = uniqBy(opportunities, (item) => item.value.id);

  if (opportunityErrors.length) {
    log(
      `Problem getting ${opportunityErrors.length.toLocaleString()} opportunities`,
      "warn",
    );
    indent();
    for (const error of opportunityErrors) log(error.value, "warn");
    deindent();
  }
  log(
    `Found ${opportunities.length.toLocaleString()} opportunities`,
    opportunities.length ? "success" : "error",
  );

  const transformedOpportunities = opportunities.map(
    (opportunity) => opportunity.value,
  );

  return transformedOpportunities;
};
