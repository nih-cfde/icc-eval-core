import coreProjects from "@/output/core-projects.json";
import { printReports } from "@/print/print";
import { browser } from "@/util/browser";
import { clearFolder, saveJson } from "@/util/file";
import { divider } from "@/util/log";

const { OUTPUT_PATH, PDF_PATH } = process.env;

/** clear existing pdfs */
// clearFolder(PDF_PATH);

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
saveJson(
  Object.fromEntries(pages.map((page) => [page.route, page.filename])),
  OUTPUT_PATH,
  "pdfs",
);

await browser.close();
