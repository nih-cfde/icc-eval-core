import { getDrc } from "@/ingest/drc";
import { getRepos } from "@/ingest/github";
import { getJournals } from "@/ingest/journals";
import { getOpportunities } from "@/ingest/opportunities";
import { getProjects } from "@/ingest/projects";
import { getPublications } from "@/ingest/publications";
import { browser } from "@/util/browser";
import { saveFile } from "@/util/file";
import { divider } from "@/util/log";

const { RAW_PATH, OUTPUT_PATH } = process.env;

divider("Opportunities");

const opportunities = await getOpportunities();

divider("Projects");

const { coreProjects, projects } = await getProjects(
  opportunities.map((opportunity) => opportunity.id),
);

divider("Publications");

const publications = await getPublications(
  projects.map((project) => project.core_project),
);
for (const coreProject of coreProjects)
  coreProject.publications = publications.filter(
    (publication) => publication.core_project === coreProject.id,
  ).length;

divider("Journals");

const journals = await getJournals(
  publications.map((publication) => publication.journal),
);

divider("GitHub");

const repos = await getRepos(coreProjects.map((coreProject) => coreProject.id));
for (const coreProject of coreProjects)
  coreProject.repos = repos.filter(
    (repo) => repo.core_project === coreProject.id,
  ).length;

divider("DRC");

const drcFiles = await getDrc();

divider("Saving");

/** save output data */
saveFile(opportunities, `${OUTPUT_PATH}/opportunities.json`);
saveFile(coreProjects, `${OUTPUT_PATH}/core-projects.json`);
saveFile(projects, `${OUTPUT_PATH}/projects.json`);
saveFile(publications, `${OUTPUT_PATH}/publications.json`);
saveFile(journals, `${OUTPUT_PATH}/journals.json`);
saveFile(repos, `${OUTPUT_PATH}/repos.json`);
saveFile(drcFiles, `${RAW_PATH}/drc-files.json`);

await browser.close();
