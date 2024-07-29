import playwright from "playwright";
import { deindent, indent, log } from "@/util/log";

/** set up browser instance, page, etc */
export const browser = await playwright.chromium.launch({ headless: true });
export const context = await browser.newContext();

/** options */
context.setDefaultTimeout(10 * 1000);

/** create new browser tab */
export const newPage = async (
  /** whether to pass page console logs to cli logs */
  debug = false,
) => {
  const page = await context.newPage();
  if (debug)
    page.on("console", (message) => {
      indent();
      log(message, "secondary");
      deindent();
    });
  return page;
};

/** go to public url and download, get local path to file */
export const download = async (
  url: string,
  page?: playwright.Page,
): Promise<string> => {
  page ??= await newPage();
  const { promise, resolve } = Promise.withResolvers<string>();
  /** https://stackoverflow.com/questions/73652378/download-files-with-goto-in-playwright-python */
  try {
    await page.goto(url);
  } catch (error) {
    //
  }
  page.on("download", (download) => download.path().then(resolve));
  return promise;
};
