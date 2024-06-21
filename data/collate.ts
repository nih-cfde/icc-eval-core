import {
  getProjectsPerCoreProject,
  getPublicationsPerCoreProject,
} from "@/database/report";
import { collateData } from "@/report/collate";
import { deindent, divider, indent } from "@/util/log";

divider();
indent();
await collateData({
  projectsPerCoreProject: getProjectsPerCoreProject(),
  publicationsPerCoreProject: getPublicationsPerCoreProject(),
});
deindent();
