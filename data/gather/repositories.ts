import { meanBy, orderBy, sumBy, toPairs, uniq, uniqBy } from "lodash-es";
import {
  fileExists,
  getCommits,
  getContributors,
  getDependencies,
  getForks,
  getIssues,
  getLanguages,
  getPullRequests,
  getRepository,
  hasReadme,
  searchRepositories,
} from "@/api/github";
import { log, timeEnd, timeStart } from "@/util/log";
import { settled } from "@/util/misc";
import { count } from "@/util/string";

/** get github repositories associated with core projects */
export const getRepositories = async (coreProjects: string[]) => {
  /** de-dupe */
  coreProjects = uniq(coreProjects);

  log(`Getting repositories for ${count(coreProjects)} core projects`);
  timeStart("Repositories");

  /**
   * search for all repositories tagged with core project number. gets base,
   * top-level details.
   */
  const [repoResults] = await settled(coreProjects, async (coreProject) => {
    log(
      `Searching for repositories tagged with "${coreProject}"`,
      "secondary",
      1,
    );
    return (await searchRepositories(coreProject)).map((repository) => ({
      owner: repository.owner?.login ?? "",
      name: repository.name,
      id: repository.id,
      coreProject,
    }));
  });

  /** flatten */
  let repositories = repoResults.flat();

  /** de-dupe */
  repositories = uniqBy(repositories, (repository) => repository.id);

  repositories.forEach(({ owner, name }) =>
    log(`${owner}/${name}`, "secondary", 1),
  );

  timeEnd("Repositories");
  timeStart("Repository details");
  log(`Getting details for ${count(repositories)} repositories`);

  const [repoDetails, errors] = await settled(
    repositories,
    async ({ owner, name, coreProject }) => {
      const label = `${owner}/${name}`;
      log(label, "secondary", 1);
      const repository = await getRepository(owner, name);
      log(`${label} - Forks`, "secondary", 1);
      const forks = await getForks(owner, name);
      log(`${label} - Commits`, "secondary", 1);
      const commits = await getCommits(owner, name);
      log(`${label} - Issues`, "secondary", 1);
      const issues = await getIssues(owner, name);
      log(`${label} - Pull Requests`, "secondary", 1);
      const pullRequests = await getPullRequests(owner, name);
      log(`${label} - Readme`, "secondary", 1);
      const readme = await hasReadme(owner, name);
      log(`${label} - Contributing`, "secondary", 1);
      const contributing = await fileExists(owner, name, "CONTRIBUTING.md");
      log(`${label} - Contributors`, "secondary", 1);
      const contributors = await getContributors(owner, name);
      log(`${label} - Languages`, "secondary", 1);
      const languages = await getLanguages(owner, name);
      log(`${label} - Dependencies`, "secondary", 1);
      const dependencies = await getDependencies(owner, name);

      return {
        ...repository,
        coreProject,
        forks,
        commits,
        issues,
        pullRequests,
        readme,
        contributing,
        contributors,
        languages,
        dependencies,
      };
    },
  );

  errors.forEach((error, index) => {
    const { owner = "", name = "" } = repositories[index] ?? {};
    log(`${owner}/${name}`, "secondary", 1);
    log(error, "warn", 2);
  });

  type Repository = Exclude<(typeof repoDetails)[number], Error>;
  type Issue = Repository["issues"][number];
  type PullRequest = Repository["pullRequests"][number];

  /** transform issue (or pull request, which gh considers sub-type of issue) */
  const mapIssue = (issue: Issue | PullRequest) => ({
    state: issue.state,
    stateReason: "state_reason" in issue ? issue.state_reason : "",
    created: issue.created_at,
    modified: issue.updated_at,
    closed: issue.closed_at,
    labels:
      issue.labels?.map((label) =>
        typeof label === "string" ? label : label.name,
      ) ?? [],
  });

  /** get average open time for issue/pr */
  const getOpenTime = (issues: (Issue | PullRequest)[]) =>
    Math.round(
      meanBy(
        issues,
        (issue) =>
          (new Date(issue.closed_at || Date.now()).getTime() -
            new Date(issue.created_at || Date.now()).getTime()) /
          1000,
      ),
    ) || 0;

  /** transform data into desired format, with fallbacks */
  const transformed = repoDetails.map((repository) => ({
    coreProject: repository.coreProject,
    id: repository.id,
    owner: repository.owner?.login ?? "",
    name: repository.name,
    description: repository.description ?? "",
    topics: (repository.topics ?? []).filter(
      (topic) => !topic.match(new RegExp(repository.coreProject, "i")),
    ),
    created: repository.created_at,
    modified: repository.pushed_at,
    stars: repository.stargazers_count,
    forks: repository.forks.map((fork) => ({ date: fork.created_at ?? "" })),
    watchers: repository.subscribers_count,
    commits: repository.commits.map((commit) => ({
      date: commit.commit?.committer?.date ?? "",
    })),
    issues: repository.issues.map(mapIssue),
    openIssues: repository.issues.filter((issue) => issue.state === "open")
      .length,
    closedIssues: repository.issues.filter((issue) => issue.state === "closed")
      .length,
    issueTimeOpen: getOpenTime(repository.issues),
    pullRequests: repository.pullRequests.map(mapIssue),
    openPullRequests: repository.pullRequests.filter(
      (pullRequest) => pullRequest.state === "open",
    ).length,
    closedPullRequests: repository.pullRequests.filter(
      (pullRequest) => pullRequest.state === "closed",
    ).length,
    pullRequestTimeOpen: getOpenTime(repository.pullRequests),
    readme: repository.readme,
    contributing: repository.contributing,
    codeOfConduct: !!repository.code_of_conduct,
    license: repository.license?.name ?? "",
    contributors: repository.contributors.map((contributor) => ({
      name: contributor.login ?? contributor.name ?? "",
      contributions: contributor.contributions,
    })),
    languages: orderBy(
      toPairs(repository.languages).map(([name, bytes]) => ({ name, bytes })),
      ({ bytes }) => bytes,
      "desc",
    ),
    dependencies: Object.fromEntries(
      repository.dependencies.repository.dependencyGraphManifests?.nodes?.map(
        (node) => [
          /** get manifest file path: /OWNER/REPO/blob/BRANCH/PATH-TO-FILE */
          (node?.blobPath ?? "").split("/").slice(5).join("/"),
          /** number of dependencies */
          node?.dependenciesCount ?? 0,
        ],
      ) ?? [],
    ),
  }));

  timeEnd("Repository details");
  log(`${count(transformed)} repositories`, "success");

  return transformed;
};

/** aggregate various stats for all repositories */
export const getRepositoriesOverview = (
  repositories: Awaited<ReturnType<typeof getRepositories>>,
) => ({
  repositories: repositories.length,
  stars: sumBy(repositories, (repository) => repository.stars),
  forks: sumBy(repositories, (repository) => repository.forks.length),
  watchers: sumBy(repositories, (repository) => repository.watchers),
  commits: sumBy(repositories, (repository) => repository.commits.length),
  openIssues: sumBy(repositories, (repository) => repository.openIssues),
  closedIssues: sumBy(repositories, (repository) => repository.closedIssues),
  openPullRequests: sumBy(
    repositories,
    (repository) => repository.openPullRequests,
  ),
  closedPullRequests: sumBy(
    repositories,
    (repository) => repository.closedPullRequests,
  ),
  readme: repositories.filter((repository) => repository.readme).length,
  contributing: repositories.filter((repository) => repository.contributing)
    .length,
  codeOfConduct: repositories.filter((repository) => repository.codeOfConduct)
    .length,
  contributors: new Set(
    repositories
      .map(({ contributors }) => contributors.map(({ name }) => name))
      .flat(),
  ).size,
  licenses: (() => {
    const counts: Record<string, number> = {};
    for (const { license } of repositories)
      counts[license] = (counts[license] ?? 0) + 1;
    return Object.fromEntries(
      orderBy(Object.entries(counts), ([, count]) => count, "desc"),
    );
  })(),
  languages: (() => {
    const counts: Record<string, number> = {};
    for (const { languages } of repositories)
      for (const { name, bytes } of languages)
        counts[name] = (counts[name] ?? 0) + bytes;
    return Object.fromEntries(
      orderBy(Object.entries(counts), ([, count]) => count, "desc"),
    );
  })(),
});

export type Repos = Awaited<ReturnType<typeof getRepositories>>[number];

export type ReposOverview = ReturnType<typeof getRepositoriesOverview>;
