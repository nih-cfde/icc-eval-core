import { exec } from "child_process";
import { mkdirSync, rmSync } from "fs";
import { browserInstance } from "@/util/browser";
import { indent, log, progress } from "@/util/log";

const { PDF_PATH = "" } = process.env;

/** regex pattern for where dashboard app is run in dev mode */
const hostPattern = /http:\/\/(localhost|(\d+\.\d+\.\d+\.\d+)):\d\d\d\d/;

/** render dashboard reports to PDF */
export const printReports = async (
  /** dashboard pages to render as reports */
  pages: (string | { route: string; filename: string })[],
) => {
  log("Printing reports");
  indent();
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
    setTimeout(() => reject("Waiting for dev server timed out"), 30 * 1000);
  });
  log(`Running on ${host}`);

  /** go to dev server */
  const { browser, page } = await browserInstance();

  for (const [key, value] of Object.entries(pages)) {
    let route = "";
    let filename = "";
    if (typeof value === "string") {
      /** make filename from route */
      route = value;
      filename = value
        .replace(/^\//, "")
        .replace(/\/$/, "")
        .replaceAll("/", "_");
    } else {
      /** explicit route and filename */
      route = value.route;
      filename = value.filename;
    }

    progress(`Printing ${route}`, key, pages);

    /** go to route that shows report */
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
  }

  /** close app */
  await browser.close();
  dev.kill();

  log(`Printed ${pages.length} PDFs`, "success");
};
