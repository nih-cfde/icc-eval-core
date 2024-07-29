import coreProjects from "@/output/core-projects.json";
import { printReports } from "@/print/print";
import { browser } from "@/util/browser";
import { saveFile } from "@/util/file";
import { divider } from "@/util/log";

const { OUTPUT_PATH } = process.env;

divider("Printing reports");

/** app pages to print */
const pages = [{ route: "/", filename: "Program" }].concat(
  coreProjects.map((coreProject) => ({
    route: `/core-project/${coreProject.id}`,
    filename: `Core Project ${coreProject.id}`,
  })),
);

/** print reports */
await printReports(pages);

/** record list of pdfs */
saveFile(
  Object.fromEntries(pages.map((page) => [page.route, page.filename])),
  `${OUTPUT_PATH}/pdfs.json`,
);

await browser.close();
