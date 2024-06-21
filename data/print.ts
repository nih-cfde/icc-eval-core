import { execSync } from "child_process";
import { getCoreProjects } from "@/database/report";
import { printReports } from "@/report/print";
import { deindent, divider, indent } from "@/util/log";

const { CI, OPEN } = process.env;

divider();
indent();
const coreProjects = Object.keys(await getCoreProjects()).map(
  (coreProject) => `/core-project/${coreProject}`,
);
await printReports(coreProjects);
deindent();

/** open preview */
if (OPEN && !CI) execSync("open $PDF_PATH");
