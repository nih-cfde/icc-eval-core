import { uniq, uniqBy } from "lodash-es";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { newPage } from "@/util/browser";
import { log } from "@/util/log";
import { filterErrors, query, queryMulti } from "@/util/request";
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

/** get common fund funding opportunities, past and present */
export const getOpportunities = async () => {
  log(`Scraping ${opportunitiesUrl} for documents`);

  /** get full list of opportunity html/pdf docs */
  let documents = await query(async () => {
    const page = await newPage();
    await page.goto(opportunitiesUrl);
    return await Promise.all(
      Array.from(await page.locator(documentsSelector).all()).map(
        async (link) => {
          const href = await link.getAttribute("href");
          if (href) return href;
          else throw Error("No href");
        },
      ),
    );
  }, "documents.json");

  /** de-dupe */
  documents = uniq(documents);

  /** get prefix of opportunity number */
  const getPrefix = (id: string) => {
    if (id.startsWith("RFA")) return "RFA";
    if (id.startsWith("NOT")) return "NOT";
    if (id.startsWith("OTA")) return "OTA";
    return "";
  };

  log(`Parsing ${count(documents)} HTML/PDF documents for opportunities`);

  let opportunities = await queryMulti(
    filterErrors(documents).map((document) => async (progress) => {
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
        const activity_code = "";

        /** validate number */
        if (id) return { id, prefix, activity_code };
        else throw Error("Doesn't seem to have opportunity number");
      }

      throw Error("Invalid document extension");
    }),
    "opportunities.json",
  );

  /** de-dupe */
  opportunities = uniqBy(opportunities, "id");

  return filterErrors(opportunities);
};
