import { meanBy, orderBy, uniq, uniqBy } from "lodash-es";
import {
  fileExists,
  getCommits,
  getContributors,
  getDependencies,
  getForks,
  getIssues,
  getLanguages,
  getPullRequests,
  getStars,
  searchRepos,
} from "@/api/github";
import { log } from "@/util/log";
import { filterErrors, queryMulti } from "@/util/request";
import { count } from "@/util/string";

/** get github repos */
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
        (await searchRepos(coreProject)).map((repo) => ({
          ...repo,
          coreProject,
        })),
    ),
    "github-repos.json",
  );

  /** filter out errors and flatten */
  let repos = filterErrors(repoResults).flat();

  /** de-dupe */
  repos = uniqBy(repos, "id");

  log(`Getting details for ${count(repos)} repos`);

  const repoDetails = await queryMulti(
    repos.map((repo) => async (progress, label) => {
      const owner = repo.owner?.login ?? "";
      const name = repo.name;

      label(`${owner}/${name}`);

      /**
       * watchers over time not possible
       * https://stackoverflow.com/questions/71090557/github-api-number-of-watch-over-time
       */

      const stars = await getStars(owner, name);
      progress(0.2);
      const forks = await getForks(owner, name);
      progress(0.3);
      const issues = await getIssues(owner, name);
      progress(0.4);
      const pullRequests = await getPullRequests(owner, name);
      progress(0.5);
      const commits = await getCommits(owner, name);
      progress(0.6);
      const contributors = await getContributors(owner, name);
      progress(0.7);
      const languages = await getLanguages(owner, name);
      progress(0.8);
      const readme = await fileExists(owner, name, "README.md");
      const contributing = await fileExists(owner, name, "CONTRIBUTING.md");
      progress(0.9);
      const dependencies = await getDependencies(owner, name);

      return {
        ...repo,
        stars,
        forks,
        issues,
        pullRequests,
        commits,
        contributors,
        languages,
        readme,
        contributing,
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
  const transformedRepos = filterErrors(repoDetails).map((repo) => ({
    coreProject: repo.coreProject,
    id: repo.id,
    owner: repo.owner?.login ?? "",
    name: repo.name,
    description: repo.description ?? "",
    topics: (repo.topics ?? []).filter(
      (topic) => !topic.match(new RegExp(repo.coreProject, "i")),
    ),
    stars: repo.stars.map((star) => ({ date: star.starred_at ?? "" })),
    watchers: repo.watchers,
    forks: repo.forks.map((fork) => ({ date: fork.created_at ?? "" })),
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
    commits: repo.commits.map((commit) => ({
      date: commit.commit?.committer?.date ?? "",
      lines: commit.stats?.total ?? 0,
    })),
    contributors: repo.contributors.map((contributor) => ({
      name: contributor.login ?? contributor.name ?? "",
      contributions: contributor.contributions,
    })),
    languages: orderBy(
      Object.entries(repo.languages).map(([language, count]) => ({
        language,
        count,
      })),
      ["count"],
      ["desc"],
    ),
    created: repo.created_at,
    modified: repo.pushed_at,
    license: repo.license?.name ?? "",
    readme: repo.readme,
    contributing: repo.contributing,
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

  return transformedRepos;
};
