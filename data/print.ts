import coreProjects from "@/output/core-projects.json";
import { printReports } from "@/print/print";
import { browser } from "@/util/browser";
import { divider } from "@/util/log";

divider("Printing reports");

await printReports(
  coreProjects.map((coreProject) => `/core-project/${coreProject.id}`),
);

await browser.close();
