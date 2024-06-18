import { addOpportunities } from "@/database/opportunities";
import { addProjects } from "@/database/projects";
import { addPublications } from "@/database/publications";
import { generateReport } from "@/database/report";
import { getOpportunities } from "@/ingest/opportunities";
import { getProjects } from "@/ingest/projects";
import { getPublications } from "@/ingest/publications";
import { deindent, divider, indent } from "@/util/log";
import { memoize } from "@/util/memoize";

divider();
indent();
const opportunities = await memoize(getOpportunities)();
deindent();

divider();
indent();
await addOpportunities(opportunities);
deindent();

divider();
indent();
const projects = await memoize(getProjects)(
  opportunities.map((opportunity) => opportunity.id),
);
deindent();

divider();
indent();
await addProjects(projects);
deindent();

divider();
indent();
const publications = await memoize(getPublications)(
  projects.map((project) => project.core_project),
);
deindent();

divider();
indent();
await addPublications(publications);
deindent();

divider();
indent();
await generateReport();
deindent();
