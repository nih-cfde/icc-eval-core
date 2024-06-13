import { exec, execSync } from "child_process";
import { writeFileSync } from "fs";
import { chdir } from "process";
import { browserInstance } from "@/util/browser";
import { deindent, indent, log } from "@/util/log";
import { db } from ".";

const appPath = "../app";
const dataPath = `${appPath}/src/data.json`;
const pdfPath = `${appPath}/public/report.pdf`;
const hostPattern = /http:\/\/(localhost|(\d+\.\d+\.\d+\.\d+)):\d\d\d\d/;

/** collate data from db for generating report */
export const generateReport = async () => {
  log("Generating report data");

  indent();
  log("Collating data");

  const opportunityPrefixes = await db
    .selectFrom("opportunity")
    .select(["prefix", (eb) => eb.fn.count("prefix").as("count")])
    .groupBy("prefix")
    .orderBy("count", "desc")
    .execute();

  const opportunityActivityCodes = await db
    .selectFrom("opportunity")
    .select(["activity_code", (eb) => eb.fn.count("activity_code").as("count")])
    .groupBy("activity_code")
    .orderBy("count", "desc")
    .execute();

  /** collated data */
  const data = {
    opportunities: {
      prefixes: opportunityPrefixes,
      activityCodes: opportunityActivityCodes,
    },
  };

  /** output collated data */
  writeFileSync(dataPath, JSON.stringify(data));

  /** run app */
  chdir(appPath);
  log("Running dev server");
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
  await page.goto(host);

  /** wait for app to render */
  log("Rendering app");
  await page.emulateMedia({ media: "print" });
  await page.waitForSelector("footer");

  /** force page resize event for e.g. autoresizing charts */
  await page.setViewportSize({ width: 8.5 * 96, height: 11 * 96 });

  /** wait for animations to finish */
  await page.waitForTimeout(1000);

  /** print pdf */
  log(`Printing PDF`);
  await page.pdf({ path: pdfPath, format: "letter" });

  /** open preview of pdf locally */
  execSync(`open ${pdfPath}`);

  /** close app */
  await browser.close();
  dev.kill();

  log("Generated PDF", "success");
  deindent();
};
