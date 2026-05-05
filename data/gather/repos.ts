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
  getRepo,
  getStars,
  hasReadme,
  searchRepos,
} from "@/api/github";
import { log } from "@/util/log";
import { settled } from "@/util/misc";
import { count } from "@/util/string";

/** get github repos associated with core projects */
export const getRepos = async (coreProjects: string[]) => {
  /** de-dupe */
  coreProjects = uniq(coreProjects);

  log(`Getting repos for ${count(coreProjects)} core projects`);

  /**
   * search for all repos tagged with core project number. gets base, top-level
   * details.
   */
  const [repoResults] = await settled(coreProjects, async (coreProject) => {
    log(`Searching for repos tagged with "${coreProject}"`, "secondary", 1);
    return (await searchRepos(coreProject)).map((repo) => ({
      owner: repo.owner?.login ?? "",
      name: repo.name,
      id: repo.id,
      coreProject,
    }));
  });

  /** flatten */
  let repos = repoResults.flat();

  /** de-dupe */
  repos = uniqBy(repos, (repo) => repo.id);

  repos.forEach(({ owner, name }) => log(`${owner}/${name}`, "secondary", 1));

  log(`Getting details for ${count(repos)} repos`);

  const [repoDetails, errors] = await settled(
    repos,
    async ({ owner, name, coreProject }) => {
      const label = `${owner}/${name}`;
      const repo = await getRepo(owner, name);
      log(`${label} - Stars`, "secondary", 1);
      const stars = await getStars(owner, name);
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
        ...repo,
        coreProject,
        stars,
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
    const { owner = "", name = "" } = repos[index] ?? {};
    log(`${owner}/${name}`, "secondary", 1);
    log(error, "warn", 2);
  });

  type Repo = Exclude<(typeof repoDetails)[number], Error>;
  type Issue = Repo["issues"][number];
  type PullRequest = Repo["pullRequests"][number];

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
  const transformed = repoDetails.map((repo) => ({
    coreProject: repo.coreProject,
    id: repo.id,
    owner: repo.owner?.login ?? "",
    name: repo.name,
    description: repo.description ?? "",
    topics: (repo.topics ?? []).filter(
      (topic) => !topic.match(new RegExp(repo.coreProject, "i")),
    ),
    created: repo.created_at,
    modified: repo.pushed_at,
    stars: repo.stars.map((star) => ({ date: star.starred_at ?? "" })),
    forks: repo.forks.map((fork) => ({ date: fork.created_at ?? "" })),
    watchers: repo.subscribers_count,
    commits: repo.commits.map((commit) => ({
      date: commit.commit?.committer?.date ?? "",
    })),
    issues: repo.issues.map(mapIssue),
    openIssues: repo.issues.filter((issue) => issue.state === "open").length,
    closedIssues: repo.issues.filter((issue) => issue.state === "closed")
      .length,
    issueTimeOpen: getOpenTime(repo.issues),
    pullRequests: repo.pullRequests.map(mapIssue),
    openPullRequests: repo.pullRequests.filter(
      (pullRequest) => pullRequest.state === "open",
    ).length,
    closedPullRequests: repo.pullRequests.filter(
      (pullRequest) => pullRequest.state === "closed",
    ).length,
    pullRequestTimeOpen: getOpenTime(repo.pullRequests),
    readme: repo.readme,
    contributing: repo.contributing,
    codeOfConduct: !!repo.code_of_conduct,
    license: repo.license?.name ?? "",
    contributors: repo.contributors.map((contributor) => ({
      name: contributor.login ?? contributor.name ?? "",
      contributions: contributor.contributions,
    })),
    languages: orderBy(
      toPairs(repo.languages).map(([name, bytes]) => ({ name, bytes })),
      ({ bytes }) => bytes,
      "desc",
    ),
    dependencies: Object.fromEntries(
      repo.dependencies.repository.dependencyGraphManifests?.nodes?.map(
        (node) => [
          /** get manifest file path: /OWNER/REPO/blob/BRANCH/PATH-TO-FILE */
          (node?.blobPath ?? "").split("/").slice(5).join("/"),
          /** number of dependencies */
          node?.dependenciesCount ?? 0,
        ],
      ) ?? [],
    ),
  }));

  log(`${count(transformed)} repos`, "success");

  return transformed;
};

/** aggregate various stats for all repos */
export const getReposOverview = (
  repos: Awaited<ReturnType<typeof getRepos>>,
) => ({
  repos: repos.length,
  stars: sumBy(repos, (repo) => repo.stars.length),
  forks: sumBy(repos, (repo) => repo.forks.length),
  watchers: sumBy(repos, (repo) => repo.watchers ?? 0),
  commits: sumBy(repos, (repo) => repo.commits.length),
  openIssues: sumBy(repos, (repo) => repo.openIssues),
  closedIssues: sumBy(repos, (repo) => repo.closedIssues),
  openPullRequests: sumBy(repos, (repo) => repo.openPullRequests),
  closedPullRequests: sumBy(repos, (repo) => repo.closedPullRequests),
  readme: repos.filter((repo) => repo.readme).length,
  contributing: repos.filter((repo) => repo.contributing).length,
  codeOfConduct: repos.filter((repo) => repo.codeOfConduct).length,
  contributors: new Set(
    repos
      .map(({ contributors }) => contributors.map(({ name }) => name))
      .flat(),
  ).size,
  licenses: (() => {
    const counts: Record<string, number> = {};
    for (const { license } of repos)
      counts[license] = (counts[license] ?? 0) + 1;
    return Object.fromEntries(
      orderBy(Object.entries(counts), ([, count]) => count, "desc"),
    );
  })(),
  languages: (() => {
    const counts: Record<string, number> = {};
    for (const { languages } of repos)
      for (const { name, bytes } of languages)
        counts[name] = (counts[name] ?? 0) + bytes;
    return Object.fromEntries(
      orderBy(Object.entries(counts), ([, count]) => count, "desc"),
    );
  })(),
});

export type Repos = Awaited<ReturnType<typeof getRepos>>[number];

export type ReposOverview = ReturnType<typeof getReposOverview>;
