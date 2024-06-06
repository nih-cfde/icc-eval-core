import { writeFileSync } from "fs";
import { memoize } from "./util/memoize";
import { addOpportunities } from "./database/opportunities";
import { getOpportunities } from "./ingest/opportunities";
import { getProjects } from "./ingest/projects";

const opportunityNumbers = await memoize(getOpportunities)();
await addOpportunities(opportunityNumbers);
const projects = await memoize(getProjects)(
  opportunityNumbers.map((opportunity) => opportunity.id)
);
writeFileSync("projects.json", JSON.stringify(projects));
