import { execSync } from "child_process";
import {
  getCoreProjects,
  getPublicationsPerCoreProject,
} from "@/database/report";
import { collateData } from "@/report/collate";
import { deindent, divider, indent } from "@/util/log";

const { CI, OPEN } = process.env;

divider();
indent();
await collateData({
  coreProjects: await getCoreProjects(),
  publicationsPerCoreProject: await getPublicationsPerCoreProject(),
});
deindent();

/** open preview */
if (OPEN && !CI) execSync("open $DATA_PATH");
