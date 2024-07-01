import { exec } from "child_process";
import { addOpportunities } from "@/database/opportunities";
import { addProjects } from "@/database/projects";
import { addPublications } from "@/database/publications";
import { getJournals } from "@/ingest/journals";
import { getOpportunities } from "@/ingest/opportunities";
import { getProjects } from "@/ingest/projects";
import { getPublications } from "@/ingest/publications";
import { diskLog, divider } from "@/util/log";
import { memoize } from "@/util/memoize";

const { CI, OPEN } = process.env;

divider("Getting opportunities");

const opportunities = await memoize(getOpportunities)();

await addOpportunities(opportunities);

divider("Getting projects");

const projects = await memoize(getProjects)(
  opportunities.map((opportunity) => opportunity.id),
);

await addProjects(projects);

divider("Getting publications");

const publications = await memoize(getPublications)(
  projects.map((project) => project.core_project),
);

await addPublications(publications);

divider("Getting journals");

const journals = await memoize(getJournals)(
  publications.map((publication) => publication.journal),
);

diskLog(journals, "journals");

/** open preview */
if (OPEN && !CI)
  exec("open '/Applications/Beekeeper Studio.app' --args $(pwd)/$DB_PATH");
