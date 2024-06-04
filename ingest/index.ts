import playwright from "playwright";

/** start browser instance, run function */
export const browser = async (
  func: (page: playwright.Page) => Promise<void>
) => {
  /** set up browser instance, page, etc */
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  /** pass page console logs to cli logs */
  page.on("console", (msg) => console.log(msg.text()));
  /** run function */
  await func(page);
  /** clean up when done */
  await browser.close();
};
