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

export const getRepos = async (coreProjects: string[]) => {
  /** de-dupe */
  coreProjects = uniq(coreProjects);

  log(
    `Getting repos for ${coreProjects.length.toLocaleString()} core projects`,
  );

  const repoResults = await queryMulti(
    coreProjects.map((coreProject) => async () => {
      /** TEMPORARY, to not query repos that aren't tagged yet */
      if (coreProject.toLowerCase() !== "u54od036472") throw Error("Skip");

      /**
       * search for all repos tagged with core project number. gets base,
       * top-level details.
       */
      return (await searchRepos(coreProject)).map((repo) => ({
        ...repo,
        core_project: coreProject,
      }));
    }),
    "github-repos.json",
  );

  /** filter out errors and flatten */
  let repos = filterErrors(repoResults).flat();

  /** de-dupe */
  repos = uniqBy(repos, "id");

  log(`Getting details for ${repos.length.toLocaleString()} repos`);

  const repoDetails = await queryMulti(
    repos.map((repo) => async (progress) => {
      const owner = repo.owner?.login ?? "";
      const name = repo.name;

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
      const pull_requests = await getPullRequests(owner, name);
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
        pull_requests,
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
  type PullRequest = Repo["pull_requests"][number];

  /** transform issue (or pull request, which gh considers sub-type of issue) */
  const mapIssue = (issue: Issue | PullRequest) => ({
    state: issue.state,
    state_reason: "state_reason" in issue ? issue.state_reason : "",
    created: issue.created_at,
    modified: issue.updated_at,
    closed: issue.closed_at,
    labels: issue.labels.map((label) =>
      typeof label === "string" ? label : label.name,
    ),
  });

  /** get average open time for issue/pr */
  const getOpenTime = (issues: (Issue | PullRequest)[]) =>
    Math.round(
      meanBy(
        issues,
        (issue) =>
          (new Date(issue.closed_at ?? Date.now()).getTime() -
            new Date(issue.created_at).getTime()) /
          1000,
      ),
    );

  /** transform data into desired format, with fallbacks */
  const transformedRepos = filterErrors(repoDetails).map((repo) => ({
    core_project: repo.core_project,
    id: repo.id,
    owner: repo.owner?.login ?? "",
    name: repo.name,
    description: repo.description ?? "",
    topics: (repo.topics ?? []).filter(
      (topic) => !topic.match(new RegExp(repo.core_project, "i")),
    ),
    stars: repo.stars.map((star) => star.starred_at ?? ""),
    watchers: repo.watchers,
    forks: repo.forks.map((fork) => fork.created_at ?? ""),
    issues: repo.issues.map(mapIssue),
    open_issues: repo.issues.filter((issue) => issue.state === "open").length,
    closed_issues: repo.issues.filter((issue) => issue.state === "closed")
      .length,
    issue_time_open: getOpenTime(repo.issues),
    pull_requests: repo.pull_requests.map(mapIssue),
    open_pull_requests: repo.pull_requests.filter(
      (pull_request) => pull_request.state === "open",
    ).length,
    closed_pull_requests: repo.pull_requests.filter(
      (pull_request) => pull_request.state === "closed",
    ).length,
    pull_request_time_open: getOpenTime(repo.pull_requests),
    commits: repo.commits.map(
      (commit) =>
        commit.commit.committer?.date ?? commit.commit.author?.date ?? "",
    ),
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
