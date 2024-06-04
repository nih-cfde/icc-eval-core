import playwright from "playwright";
import { deindent, indent, log } from "../util/log";

/** start browser instance, run function */
export const browserInstance = async () => {
  /** set up browser instance, page, etc */
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  /** pass page console logs to cli logs */
  page.on("console", (msg) => {
    indent();
    log("secondary", msg.text());
    deindent();
  });
  return { browser, page };
};
