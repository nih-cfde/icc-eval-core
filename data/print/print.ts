import { exec } from "child_process";
import { newPage } from "@/util/browser";
import { deindent, indent, log } from "@/util/log";
import { allSettled } from "@/util/request";

const { PDF_PATH } = process.env;

/** regex pattern for where dashboard app is run in dev mode */
const hostPattern = /http:\/\/(localhost|(\d+\.\d+\.\d+\.\d+)):\d\d\d\d/;

/** render dashboard reports to PDF */
export const printReports = async (
  /** dashboard pages to render as reports */
  pages: string[],
) => {
  log("Running dev server");

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

  log(`Printing ${pages.length.toLocaleString()} pages`);

  indent();
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
      const url = host + route;
      log(url, "start");
      const page = await newPage();
      await page.goto(url);

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
    (route) => log(route, "start"),
    (route) => log(route, "success"),
    (route) => log(route, "warn"),
  );
  deindent();

  /** close app */
  dev.kill();

  if (results.length)
    log(`Printed ${results.length.toLocaleString()} PDFs`, "success");
  if (errors.length) {
    for (const error of errors) log(error.value, "warn");
    log(`Error printing ${errors.length.toLocaleString()} PDFs`, "error");
  }
};
