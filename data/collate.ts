import { execSync } from "child_process";
import {
  getCoreProjects,
  getPublicationsPerCoreProject,
} from "@/database/report";
import { collateData } from "@/report/collate";
import { divider } from "@/util/log";

const { CI, OPEN } = process.env;

divider("Collating data");

await collateData({
  coreProjects: await getCoreProjects(),
  publicationsPerCoreProject: await getPublicationsPerCoreProject(),
});

/** open preview */
if (OPEN && !CI) execSync("open $DATA_PATH");
