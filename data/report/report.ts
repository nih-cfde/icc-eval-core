import { exec, execSync } from "child_process";
import { writeFileSync } from "fs";
import { chdir } from "process";
import { kebabCase } from "lodash-es";
import { getPublicationsPerCoreProject } from "@/database/report";
import { browserInstance } from "@/util/browser";
import { deindent, indent, log } from "@/util/log";

const appPath = "../app";
const dataPath = `${appPath}/src/data`;
const pdfPath = `${appPath}/public/pdfs`;
const hostPattern = /http:\/\/(localhost|(\d+\.\d+\.\d+\.\d+)):\d\d\d\d/;

/** collate data from db for generating report */
export const generateReport = async () => {
  log("Generating report data");

  indent();
  log("Collating data");

  /** collated data */
  const data = {
    publicationsPerCoreProject: await getPublicationsPerCoreProject(),
  };

  /** output collated data */
  for (const [key, value] of Object.entries(data))
    writeFileSync(
      `${dataPath}/${kebabCase(key)}.json`,
      JSON.stringify(value, null, 2),
    );

  /** pages/reports to render */
  const pages: { route: string; filename: string }[] = Object.keys(
    data.publicationsPerCoreProject,
  ).map((key) => ({ route: `/project/${key}`, filename: key }));

  log("Running dev server");

  /** run app */
  chdir(appPath);
  const dev = exec("yarn dev", () => null);

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

  for (const { route, filename } of pages) {
    log(`Printing ${route}`);

    /** go to route that shows report */
    await page.goto(host + route);

    /** wait for app to render */
    await page.emulateMedia({ media: "print" });
    await page.waitForSelector("footer");

    /** force page resize event for e.g. auto-resizing charts */
    await page.setViewportSize({ width: 8.5 * 96, height: 11 * 96 });

    /** wait for animations to finish */
    await page.waitForTimeout(1000);

    /** print pdf */
    await page.pdf({ path: `${pdfPath}/${filename}.pdf`, format: "letter" });
  }

  /** open preview of pdfs locally */
  execSync(`open ${pdfPath}`);

  /** close app */
  await browser.close();
  dev.kill();

  log("Generated PDF", "success");
  deindent();
};
