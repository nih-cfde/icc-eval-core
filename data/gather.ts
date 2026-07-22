import { mkdirSync } from "fs";
import { getAnalytics, getAnalyticsOverview } from "@/gather/analytics";
import { getDrc } from "@/gather/drc";
import { getJournals } from "@/gather/journals";
import { getOpportunities } from "@/gather/opportunities";
import { getProjects } from "@/gather/projects";
import { getPublications } from "@/gather/publications";
import {
  getRepositories,
  getRepositoriesOverview,
} from "@/gather/repositories";
import { getUsers } from "@/gather/users";
import { browser } from "@/util/browser";
import { saveFile } from "@/util/file";
import { divider, timeEnd, timeStart } from "@/util/log";
import { match } from "@/util/string";

const { MANUAL_PATH, RAW_PATH, OUTPUT_PATH } = process.env;

/** make folders if needed */
mkdirSync(MANUAL_PATH, { recursive: true });
mkdirSync(RAW_PATH, { recursive: true });
mkdirSync(OUTPUT_PATH, { recursive: true });

/** ========================================================================= */

divider("Opportunities");
timeStart();
const opportunities = await getOpportunities();
saveFile(opportunities, `${OUTPUT_PATH}/opportunities.json`);
// saveFile(opportunities, `${MANUAL_PATH}/opportunities.json`);
timeEnd();

/** ========================================================================= */

divider("Projects");
timeStart();
const { coreProjects, projects } = await getProjects(
  opportunities.map((opportunity) => opportunity.id),
);
saveFile(coreProjects, `${OUTPUT_PATH}/core-projects.json`);
saveFile(projects, `${OUTPUT_PATH}/projects.json`);
timeEnd();

/** ========================================================================= */

divider("Publications");
timeStart();
const publications = await getPublications(
  projects.map((project) => project.coreProject),
);
saveFile(publications, `${OUTPUT_PATH}/publications.json`);
timeEnd();

/** ========================================================================= */

divider("Journals");
timeStart();
const journals = await getJournals(
  publications.map((publication) => publication.journal),
);
saveFile(journals, `${OUTPUT_PATH}/journals.json`);
timeEnd();

/** ========================================================================= */

divider("Analytics");
timeStart();
const analytics = await getAnalytics();
saveFile(analytics, `${OUTPUT_PATH}/analytics.json`);
const analyticsOverview = await getAnalyticsOverview(analytics);
saveFile(analyticsOverview, `${OUTPUT_PATH}/analytics-overview.json`);
timeEnd();

/** ========================================================================= */

divider("Repositories");
timeStart();
const repositories = await getRepositories(
  coreProjects.map((coreProject) => coreProject.id),
);
saveFile(repositories, `${OUTPUT_PATH}/repositories.json`);
const repositoriesOverview = await getRepositoriesOverview(repositories);
saveFile(repositoriesOverview, `${OUTPUT_PATH}/repositories-overview.json`);
timeEnd();

/** ========================================================================= */

divider("Core project counts");
timeStart();
for (const coreProject of coreProjects) {
  coreProject.publications = publications.filter((publication) =>
    match(publication.coreProject, coreProject.id),
  ).length;
  coreProject.analytics = analytics.filter((analytic) =>
    match(analytic.coreProject, coreProject.id),
  ).length;
  coreProject.repositories = repositories.filter((repository) =>
    match(repository.coreProject, coreProject.id),
  ).length;
}
saveFile(coreProjects, `${OUTPUT_PATH}/core-projects.json`);
timeEnd();

/** ========================================================================= */

divider("DRC");
timeStart();
const { dcc, file, code } = await getDrc();
saveFile(dcc, `${OUTPUT_PATH}/drc-dcc.json`);
saveFile(file, `${OUTPUT_PATH}/drc-file.json`);
saveFile(code, `${OUTPUT_PATH}/drc-code.json`);
timeEnd();

/** ========================================================================= */

divider("Users");
timeStart();
const users = await getUsers();
saveFile(users, `${OUTPUT_PATH}/users.json`);
timeEnd();

/** ========================================================================= */

await browser.close();
