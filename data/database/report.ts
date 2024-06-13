import { exec, execSync } from "child_process";
import { writeFileSync } from "fs";
import { chdir } from "process";
import { browserInstance } from "@/util/browser";
import { log } from "@/util/log";
import { db } from ".";

const appPath = "../app";
const dataPath = `${appPath}/src/data.json`;
const pdfPath = `${appPath}/public/report.pdf`;
const hostPattern = /http:\/\/(localhost|(\d+\.\d+\.\d+\.\d+)):\d\d\d\d/;

/** collate data from db for generating report */
export const generateReport = async () => {
  log("info", "Generating report data");

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
  execSync("yarn install");
  const dev = exec("yarn dev");

  /** wait for dev server to be ready */
  const host = await new Promise<string>((resolve) =>
    dev.stdout?.on("data", (chunk: string) => {
      const [host] = chunk.match(hostPattern) ?? [];
      if (host) resolve(host);
    }),
  );

  /** go to dev server */
  const { browser, page } = await browserInstance();
  await page.goto(host);

  /** wait for app to render */
  await page.waitForSelector("footer");

  /** print pdf */
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: pdfPath, format: "letter" });

  /** close app */
  await browser.close();
  dev.kill();
};
