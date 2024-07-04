import coreProjects from "@/output/core-projects.json";
import { printReports } from "@/print/print";
import { browser } from "@/util/browser";
import { clearFolder } from "@/util/file";
import { divider } from "@/util/log";

const { PDF_PATH } = process.env;

clearFolder(PDF_PATH);

divider("Printing reports");

await printReports(
  coreProjects.map((coreProject) => `/core-project/${coreProject.id}`),
);

await browser.close();
