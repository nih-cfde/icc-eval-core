import { addOpportunities } from "./database/opportunities";
import { addProjects } from "./database/projects";
import { getOpportunities } from "./ingest/opportunities";
import { getProjects } from "./ingest/projects";
import { getPublications } from "./ingest/publications";
import { memoize } from "./util/memoize";

const opportunities = await memoize(getOpportunities)();

await addOpportunities(opportunities);

const projects = await memoize(getProjects)(
  opportunities.map((opportunity) => opportunity.id),
);

await addProjects(projects);

const publications = await memoize(getPublications)(
  projects.map((project) => project.core_project),
);

console.log(publications);
