import { mkdirSync } from "fs";
import { isEqual, uniqWith } from "lodash-es";
import { getAnalytics } from "@/gather/analytics";
import { getDrc } from "@/gather/drc";
import { getJournals } from "@/gather/journals";
import { getOpportunities } from "@/gather/opportunities";
import { getProjects } from "@/gather/projects";
import { getPublications } from "@/gather/publications";
import { getRepos } from "@/gather/repos";
import { browser } from "@/util/browser";
import { loadFile, saveFile } from "@/util/file";
import { divider, log } from "@/util/log";
import { match } from "@/util/string";

const { PRIVATE, CACHE, RAW_PATH, OUTPUT_PATH, CI } = process.env;

log(`Running in ${PRIVATE ? "PRIVATE" : "PUBLIC"} mode`);
log(`Cache ${CACHE ? "ON" : "OFF"}`);

/** output file names */
const opportunitiesFile = "opportunities.json";
const coreProjectsFile = "core-projects.json";
const projectsFile = "projects.json";
const publicationsFile = "publications.json";
const journalsFile = "journals.json";
const analyticsFile = "analytics.json";
const reposFile = "repos.json";
const drcDccFile = "drc-dcc.json";
const drcFileFile = "drc-file.json";
const drcCodeFile = "drc-code.json";

/** make folders if needed */
mkdirSync(RAW_PATH, { recursive: true });
mkdirSync(OUTPUT_PATH, { recursive: true });

// eslint-disable-next-line
type AsyncFunc = (...args: any) => Promise<unknown>;
type Result<Func extends AsyncFunc> = Awaited<ReturnType<Func>>;

/** load existing data from public repo when running in private mode */
const loadPublic = async <Result>(file: string) => {
  const path = `${OUTPUT_PATH}/${file}`;
  try {
    return (await loadFile<Result>(path)).data;
  } catch (error) {
    throw Error(`Couldn't load ${file}`);
  }
};

divider("Opportunities");

let opportunities: Result<typeof getOpportunities> = [];

try {
  opportunities = PRIVATE
    ? await loadPublic(opportunitiesFile)
    : await getOpportunities();
} catch (error) {
  log("Couldn't get opportunities", "warn");
}

const manualOpportunities = (
  await loadFile<Result<typeof getOpportunities>>(
    `${RAW_PATH}/manual-opportunities.json`,
  )
).data;

opportunities = uniqWith(opportunities.concat(manualOpportunities), isEqual);

log(`${opportunities.length} opportunities`);

divider("Projects");

const manualCoreProjects = (
  await loadFile<string[]>(`${RAW_PATH}/manual-core-projects.json`)
).data;

const { coreProjects, projects }: Result<typeof getProjects> = PRIVATE
  ? {
      coreProjects: await loadPublic(coreProjectsFile),
      projects: await loadPublic(projectsFile),
    }
  : await getProjects(
      opportunities.map((opportunity) => opportunity.id),
      manualCoreProjects,
    );

log(`${coreProjects.length} core projects`);
log(`${projects.length} projects`);

divider("Publications");

const publications: Result<typeof getPublications> = PRIVATE
  ? await loadPublic(publicationsFile)
  : await getPublications(projects.map((project) => project.coreProject));

log(`${publications.length} publications`);

divider("Journals");

const journals: Result<typeof getJournals> =
  /** scimago banning/limiting us when running on gh-actions */
  PRIVATE || CI
    ? await loadPublic(journalsFile)
    : await getJournals(publications.map((publication) => publication.journal));

log(`${journals.length} journals`);

divider("Analytics");

const analytics = PRIVATE ? await getAnalytics() : [];

log(`${analytics.length} analytics`);

divider("Repos");

const repos = PRIVATE
  ? await getRepos(coreProjects.map((coreProject) => coreProject.id))
  : [];

log(`${repos.length} repos`);

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

const { dcc, file, code }: Result<typeof getDrc> = PRIVATE
  ? {
      dcc: await loadPublic(drcDccFile),
      file: await loadPublic(drcFileFile),
      code: await loadPublic(drcCodeFile),
    }
  : await getDrc();

divider("Saving");

/** save output data */
saveFile(opportunities, `${OUTPUT_PATH}/${opportunitiesFile}`);
saveFile(coreProjects, `${OUTPUT_PATH}/${coreProjectsFile}`);
saveFile(projects, `${OUTPUT_PATH}/${projectsFile}`);
saveFile(publications, `${OUTPUT_PATH}/${publicationsFile}`);
saveFile(journals, `${OUTPUT_PATH}/${journalsFile}`);
saveFile(dcc, `${OUTPUT_PATH}/${drcDccFile}`);
saveFile(file, `${OUTPUT_PATH}/${drcFileFile}`);
saveFile(code, `${OUTPUT_PATH}/${drcCodeFile}`);
if (PRIVATE) {
  saveFile(analytics, `${OUTPUT_PATH}/${analyticsFile}`);
  saveFile(repos, `${OUTPUT_PATH}/${reposFile}`);
}

await browser.close();
