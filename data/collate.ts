import {
  getCoreProjects,
  getPublicationsPerCoreProject,
} from "@/database/report";
import { collateData } from "@/report/collate";
import { deindent, divider, indent } from "@/util/log";

divider();
indent();
await collateData({
  coreProjects: await getCoreProjects(),
  publicationsPerCoreProject: await getPublicationsPerCoreProject(),
});
deindent();
