import { execSync } from "child_process";
import { getCoreProjects } from "@/database/report";
import { printReports } from "@/report/print";
import { divider } from "@/util/log";

const { CI, OPEN } = process.env;

const coreProjects = Object.keys(await getCoreProjects()).map(
  (coreProject) => `/core-project/${coreProject}`,
);

divider("Printing reports");

await printReports(coreProjects);

/** open preview */
if (OPEN && !CI) execSync("open $PDF_PATH");
