import { mkdirSync, rmSync } from "fs";
import { getJournals } from "@/ingest/journals";
import { getOpportunities } from "@/ingest/opportunities";
import { getProjects } from "@/ingest/projects";
import { getPublications } from "@/ingest/publications";
import { browser } from "@/util/browser";
import { saveJson } from "@/util/file";
import { divider } from "@/util/log";

const { DATA_PATH = "" } = process.env;

divider("Opportunities");

const opportunities = await getOpportunities();

divider("Projects");

let { coreProjects, projects } = await getProjects(
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

divider("Saving");

/** clear folder */
rmSync(DATA_PATH, { force: true, recursive: true });
mkdirSync(DATA_PATH, { recursive: true });

saveJson(opportunities, "opportunities");
saveJson(coreProjects, "core-projects");
saveJson(projects, "projects");
saveJson(publications, "publications");
saveJson(journals, "journals");

await browser.close();
