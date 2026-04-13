import { mkdirSync } from "fs";
import { getAnalytics, getAnalyticsOverview } from "@/gather/analytics";
import { getDrc } from "@/gather/drc";
import { getJournals } from "@/gather/journals";
import { getOpportunities } from "@/gather/opportunities";
import { getProjects } from "@/gather/projects";
import { getPublications } from "@/gather/publications";
import { getRepos, getReposOverview } from "@/gather/repos";
import { browser } from "@/util/browser";
import { saveFile } from "@/util/file";
import { divider } from "@/util/log";
import { match } from "@/util/string";

const { MANUAL_PATH, RAW_PATH, OUTPUT_PATH } = process.env;

/** make folders if needed */
mkdirSync(MANUAL_PATH, { recursive: true });
mkdirSync(RAW_PATH, { recursive: true });
mkdirSync(OUTPUT_PATH, { recursive: true });

/** ========================================================================= */

divider("Opportunities");
const opportunities = await getOpportunities();
saveFile(opportunities, `${OUTPUT_PATH}/opportunities.json`);

/** ========================================================================= */

divider("Projects");
const { coreProjects, projects } = await getProjects(
  opportunities.map((opportunity) => opportunity.id),
);
saveFile(coreProjects, `${OUTPUT_PATH}/core-projects.json`);
saveFile(projects, `${OUTPUT_PATH}/projects.json`);

/** ========================================================================= */

divider("Publications");

const publications = await getPublications(
  projects.map((project) => project.coreProject),
);
saveFile(publications, `${OUTPUT_PATH}/publications.json`);

/** ========================================================================= */

divider("Journals");
const journals = await getJournals(
  publications.map((publication) => publication.journal),
);
saveFile(journals, `${OUTPUT_PATH}/journals.json`);

/** ========================================================================= */

divider("Analytics");
const analytics = await getAnalytics();
saveFile(analytics, `${OUTPUT_PATH}/analytics.json`);
const analyticsOverview = await getAnalyticsOverview(analytics);
saveFile(analyticsOverview, `${OUTPUT_PATH}/analytics-overview.json`);

/** ========================================================================= */

divider("Repos");
const repos = await getRepos(coreProjects.map((coreProject) => coreProject.id));
saveFile(repos, `${OUTPUT_PATH}/repos.json`);
const reposOverview = await getReposOverview(repos);
saveFile(reposOverview, `${OUTPUT_PATH}/repos-overview.json`);

/** ========================================================================= */

divider("Core project counts");
for (const coreProject of coreProjects) {
  coreProject.publications = publications.filter((publication) =>
    match(publication.coreProject, coreProject.id),
  ).length;
  coreProject.analytics = analytics.filter((analytic) =>
    match(analytic.coreProject, coreProject.id),
  ).length;
  coreProject.repos = repos.filter((repo) =>
    match(repo.coreProject, coreProject.id),
  ).length;
}
saveFile(coreProjects, `${OUTPUT_PATH}/core-projects.json`);

/** ========================================================================= */

divider("DRC");
const { dcc, file, code } = await getDrc();
saveFile(dcc, `${OUTPUT_PATH}/drc-dcc.json`);
saveFile(file, `${OUTPUT_PATH}/drc-file.json`);
saveFile(code, `${OUTPUT_PATH}/drc-code.json`);

/** ========================================================================= */

await browser.close();
