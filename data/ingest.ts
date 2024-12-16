import { mkdirSync } from "fs";
import { getAnalytics } from "@/ingest/analytics";
import { getDrc } from "@/ingest/drc";
import { getJournals } from "@/ingest/journals";
import { getOpportunities } from "@/ingest/opportunities";
import { getProjects } from "@/ingest/projects";
import { getPublications } from "@/ingest/publications";
import { getRepos } from "@/ingest/repos";
import { browser } from "@/util/browser";
import { saveFile } from "@/util/file";
import { divider } from "@/util/log";
import { match } from "@/util/string";

const { RAW_PATH, OUTPUT_PATH } = process.env;

/** make folders if needed */
mkdirSync(RAW_PATH, { recursive: true });
mkdirSync(OUTPUT_PATH, { recursive: true });

divider("Opportunities");

const opportunities = await getOpportunities();

divider("Projects");

const { coreProjects, projects } = await getProjects(
  opportunities.map((opportunity) => opportunity.id),
);

divider("Publications");

const publications = await getPublications(
  projects.map((project) => project.coreProject),
);

divider("Journals");

const journals = await getJournals(
  publications.map((publication) => publication.journal),
);

divider("Analytics");

const analytics = await getAnalytics();

divider("Repos");

const repos = await getRepos(coreProjects.map((coreProject) => coreProject.id));

divider("Supplemental counts");

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

divider("DRC");

const { dcc, file, code } = await getDrc();

divider("Saving");

/** save output data */
saveFile(opportunities, `${OUTPUT_PATH}/opportunities.json`);
saveFile(coreProjects, `${OUTPUT_PATH}/core-projects.json`);
saveFile(projects, `${OUTPUT_PATH}/projects.json`);
saveFile(publications, `${OUTPUT_PATH}/publications.json`);
saveFile(journals, `${OUTPUT_PATH}/journals.json`);
saveFile(analytics, `${OUTPUT_PATH}/analytics.json`);
saveFile(repos, `${OUTPUT_PATH}/repos.json`);
saveFile(dcc, `${OUTPUT_PATH}/drc-dcc.json`);
saveFile(file, `${OUTPUT_PATH}/drc-file.json`);
saveFile(code, `${OUTPUT_PATH}/drc-code.json`);

await browser.close();
