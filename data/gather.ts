import { mkdirSync } from "fs";
import { isEqual, orderBy, sumBy, uniqWith } from "lodash-es";
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
const repoOverviewFile = "repo-overview.json";
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

/** ========================================================================= */

divider("Opportunities");

/** funding opportunities */
let opportunities: Result<typeof getOpportunities> = [];

/** get opportunities */
try {
  opportunities = PRIVATE
    ? /** PRIVATE MODE */
      await loadPublic(opportunitiesFile)
    : /** PUBLIC MODE */
      await getOpportunities();
} catch (error) {
  log("Couldn't get opportunities", "warn");
}

/** get manual opportunities */
const manualOpportunities = (
  await loadFile<Result<typeof getOpportunities>>(
    `${RAW_PATH}/manual-opportunities.json`,
  )
).data;

/** merge fetched and manual data */
opportunities = uniqWith(opportunities.concat(manualOpportunities), isEqual);

log(`${opportunities.length} opportunities`);

/** ========================================================================= */

divider("Projects");

/** get manual projects */
const manualCoreProjects = (
  await loadFile<string[]>(`${RAW_PATH}/manual-core-projects.json`)
).data;

/** get projects from opportunities */
const { coreProjects, projects }: Result<typeof getProjects> = PRIVATE
  ? /** PRIVATE MODE */
    {
      coreProjects: await loadPublic(coreProjectsFile),
      projects: await loadPublic(projectsFile),
    }
  : /** PUBLIC MODE */
    await getProjects(
      opportunities.map((opportunity) => opportunity.id),
      manualCoreProjects,
    );

log(`${coreProjects.length} core projects`);
log(`${projects.length} projects`);

/** ========================================================================= */

divider("Publications");

/** get publications from projects */
const publications: Result<typeof getPublications> = PRIVATE
  ? /** PRIVATE MODE */
    await loadPublic(publicationsFile)
  : /** PUBLIC MODE */
    await getPublications(projects.map((project) => project.coreProject));

log(`${publications.length} publications`);

/** ========================================================================= */

divider("Journals");

/** get journals from publications */
const journals: Result<typeof getJournals> =
  /** scimago banning/limiting us when running on gh-actions */
  PRIVATE || CI
    ? /** PRIVATE MODE */
      await loadPublic(journalsFile)
    : /** PUBLIC MODE */
      await getJournals(publications.map((publication) => publication.journal));

log(`${journals.length} journals`);

/** ========================================================================= */

divider("Analytics");

/** get website analytics data */
const analytics = PRIVATE
  ? /** PRIVATE MODE */ await getAnalytics()
  : /** PUBLIC MODE */ [];

log(`${analytics.length} analytics`);

/** ========================================================================= */

divider("Repos");

/** get software repo data */
const repos = PRIVATE
  ? /** PRIVATE MODE */
    await getRepos(coreProjects.map((coreProject) => coreProject.id))
  : /** PUBLIC MODE */
    [];

log(`${repos.length} repos`);

/** ========================================================================= */

divider("Core project counts");

/** calculate various counts for each core project */
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

/** ========================================================================= */

divider("Repo overview");

/** aggregate various stats for all repos in total */
const repoOverview = {
  repos: repos.length,
  stars: sumBy(repos, (repo) => repo.stars.length),
  forks: sumBy(repos, (repo) => repo.forks.length),
  commits: sumBy(repos, (repo) => repo.commits.length),
  openIssues: sumBy(repos, (repo) => repo.openIssues),
  closedIssues: sumBy(repos, (repo) => repo.closedIssues),
  openPullRequests: sumBy(repos, (repo) => repo.openPullRequests),
  closedPullRequests: sumBy(repos, (repo) => repo.closedPullRequests),
  watchers: sumBy(repos, (repo) => repo.watchers ?? 0),
  contributors: new Set(
    repos
      .map(({ contributors }) => contributors.map(({ name }) => name))
      .flat(),
  ).size,
  languages: (() => {
    const counts: Record<string, number> = {};
    for (const { languages } of repos)
      for (const { name, bytes } of languages)
        counts[name] = (counts[name] ?? 0) + bytes;
    return Object.fromEntries(
      orderBy(Object.entries(counts), (count) => count[1], "desc"),
    );
  })(),
  readme: repos.filter((repo) => repo.readme).length,
  contributing: repos.filter((repo) => repo.contributing).length,
  licenses: (() => {
    const counts: Record<string, number> = {};
    for (const { license } of repos)
      counts[license] = (counts[license] ?? 0) + 1;
    return Object.fromEntries(
      orderBy(Object.entries(counts), (item) => item[1], "desc"),
    );
  })(),
};

/** ========================================================================= */

divider("DRC");

/** get drc data */
const { dcc, file, code }: Result<typeof getDrc> = PRIVATE
  ? /** PRIVATE MODE */
    {
      dcc: await loadPublic(drcDccFile),
      file: await loadPublic(drcFileFile),
      code: await loadPublic(drcCodeFile),
    }
  : /** PUBLIC MODE */
    await getDrc();

/** ========================================================================= */

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
  saveFile(repoOverview, `${OUTPUT_PATH}/${repoOverviewFile}`);
}

await browser.close();
