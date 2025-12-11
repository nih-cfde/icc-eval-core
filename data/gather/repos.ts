import { fromPairs, meanBy, orderBy, toPairs, uniq, uniqBy } from "lodash-es";
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
import { filterErrors, queryMulti } from "@/util/request";
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
  const repoResults = await queryMulti(
    coreProjects.map(
      (coreProject) => async () =>
        (await searchRepos(coreProject)).map((repo) => ({ repo, coreProject })),
    ),
    "github-repos.json",
  );

  /** filter out errors and flatten */
  let repos = filterErrors(repoResults).flat();

  /** de-dupe */
  repos = uniqBy(repos, ({ repo }) => repo.id);

  log(`Getting details for ${count(repos)} repos`);

  const repoDetails = await queryMulti(
    repos.map(({ repo: _repo, coreProject }) => async (progress, label) => {
      const owner = _repo.owner?.login ?? "";
      const name = _repo.name;

      label(`${owner}/${name}`);

      const repo = await getRepo(owner, name);
      progress(0.1);
      const stars = await getStars(owner, name);
      progress(0.2);
      const forks = await getForks(owner, name);
      progress(0.3);
      const commits = await getCommits(owner, name);
      progress(0.4);
      const issues = await getIssues(owner, name);
      progress(0.5);
      const pullRequests = await getPullRequests(owner, name);
      progress(0.6);
      const readme = await hasReadme(owner, name);
      const contributing = await fileExists(owner, name, "CONTRIBUTING.md");
      progress(0.7);
      const contributors = await getContributors(owner, name);
      progress(0.8);
      const languages = await getLanguages(owner, name);
      progress(0.9);
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
    }),
    "github-repo-details.json",
  );

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
  const transformed = filterErrors(repoDetails).map((repo) => ({
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
      (item) => item.bytes,
      "desc",
    ),
    dependencies: fromPairs(
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

  return transformed;
};
