import playwright from "playwright";
import { log } from "@/util/log";

/** set up browser instance, page, etc */
const { HEADLESS_BROWSER } = process.env;

export const browser = await playwright.chromium.launch({
  headless: HEADLESS_BROWSER == "true",
});
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
      log(message, "secondary");
    });
  return page;
};
