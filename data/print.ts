import { execSync } from "child_process";
import { getProjectsPerCoreProject } from "@/database/report";
import { printReports } from "@/report/print";
import { deindent, divider, indent } from "@/util/log";

divider();
indent();
const coreProjects = Object.keys(await getProjectsPerCoreProject()).map(
  (coreProject) => `/project/${coreProject}`,
);
await printReports(coreProjects);
deindent();

/** open preview */
if (!process.env.CI) execSync("open $PDF_PATH");
