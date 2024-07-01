import { exec } from "child_process";
import { mkdirSync, rmSync } from "fs";
import { browserInstance } from "@/util/browser";
import { log } from "@/util/log";
import { allSettled } from "@/util/request";

const { PDF_PATH = "" } = process.env;

/** regex pattern for where dashboard app is run in dev mode */
const hostPattern = /http:\/\/(localhost|(\d+\.\d+\.\d+\.\d+)):\d\d\d\d/;

/** render dashboard reports to PDF */
export const printReports = async (
  /** dashboard pages to render as reports */
  pages: string[],
) => {
  log("Running dev server");

  /** clear folder */
  rmSync(PDF_PATH, { force: true, recursive: true });
  mkdirSync(PDF_PATH);

  /** run app */
  const dev = exec("yarn --cwd $APP_PATH dev", () => null);

  /** wait for dev server to be ready */
  const host = await new Promise<string>((resolve, reject) => {
    dev.stdout?.on("data", (chunk: string) => {
      const [host] = chunk.match(hostPattern) ?? [];
      if (host) resolve(host);
    });
    setTimeout(() => reject("Waiting for dev server timed out"), 5 * 1000);
  });

  log(`Running on ${host}`);

  const { browser, newPage } = await browserInstance();

  log(`Printing ${pages.length.toLocaleString()} pages`);

  /** run in parallel */
  const { results, errors } = await allSettled(
    pages,
    async (route: (typeof pages)[number]) => {
      /** make filename from route */
      const filename = route
        .replace(/^\//, "")
        .replace(/\/$/, "")
        .replaceAll("/", "_");

      /** go to route that shows report */
      const page = await newPage();
      await page.goto(host + route);

      /** wait for app to render */
      await page.emulateMedia({ media: "print" });
      await page.waitForSelector("main");

      /** force page resize event for e.g. auto-resizing charts */
      await page.setViewportSize({ width: 8.5 * 96, height: 11 * 96 });

      /** wait for animations to finish */
      await page.waitForTimeout(1000);

      /** print pdf */
      await page.pdf({
        path: `${PDF_PATH}/${filename}.pdf`,
        format: "letter",
        landscape: true,
      });
    },
  );

  /** close app */
  dev.kill();
  await browser.close();

  if (results.length)
    log(`Printed ${results.length.toLocaleString()} PDFs`, "success");
  if (errors.length)
    log(`Error printing ${errors.length.toLocaleString()} PDFs`, "error");
};
