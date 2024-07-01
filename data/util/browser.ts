import playwright from "playwright";
import { deindent, indent, log } from "@/util/log";

/** start browser instance */
export const browserInstance = async () => {
  /** set up browser instance, page, etc */
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();

  /** options */
  context.setDefaultTimeout(5 * 1000);

  /** create new browser tab */
  const newPage = async (
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

  return { browser, newPage };
};
