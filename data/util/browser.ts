import playwright from "playwright";
import { deindent, indent, log } from "@/util/log";

/** set up browser instance, page, etc */
export const browser = await playwright.chromium.launch();
export const context = await browser.newContext();

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
