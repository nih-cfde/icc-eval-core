import { addOpportunities } from "./database/opportunities";
import { addProjects } from "./database/projects";
import { getOpportunities } from "./ingest/opportunities";
import { getProjects } from "./ingest/projects";
import { memoize } from "./util/memoize";

const opportunityNumbers = await memoize(getOpportunities)();

await addOpportunities(opportunityNumbers);

const projects = await memoize(getProjects)(
  opportunityNumbers.map((opportunity) => opportunity.id),
);

await addProjects(projects);
