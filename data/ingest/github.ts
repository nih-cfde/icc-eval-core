import { meanBy } from "lodash-es";
import {
  fileExists,
  getCommits,
  getContributors,
  getDependencies,
  getForks,
  getIssues,
  getPullRequests,
  getStars,
  searchRepos,
} from "@/api/github";
import { deindent, indent, log } from "@/util/log";
import { queryMulti } from "@/util/request";

export const getRepos = async (coreProjects: string[]) => {
  log(
    `Getting repos for ${coreProjects.length.toLocaleString()} core projects`,
  );

  indent();
  /** run in parallel */
  const { results: repos, errors: repoErrors } = await queryMulti(
    coreProjects,
    async (coreProject) => {
      /** TEMPORARY, to not query repos that aren't tagged yet */
      if (coreProject.toLowerCase() !== "u54od036472") throw Error("Skip");

      /** search for all repos tagged with core project number */
      const repos = await searchRepos(coreProject);

      /** for each repo */
      return await Promise.all(
        repos.map(async (repo) => {
          const owner = repo.owner?.login ?? "";
          const name = repo.name;

          return {
            /** associated core project number */
            core_project: coreProject,
            /** base top-level details */
            ...repo,
            stars: await getStars(owner, name),
            /**
             * watchers over time not possible
             * https://stackoverflow.com/questions/71090557/github-api-number-of-watch-over-time
             */
            forks: await getForks(owner, name),
            issues: await getIssues(owner, name),
            pull_requests: await getPullRequests(owner, name),
            commits: await getCommits(owner, name),
            contributors: await getContributors(owner, name),
            readme: await fileExists(owner, name, "README.md"),
            contributing: await fileExists(owner, name, "CONTRIBUTING.md"),
            dependencies: await getDependencies(owner, name),
          };
        }),
      );
    },
    (coreProject) => log(coreProject, "start"),
    (coreProject, repos) =>
      log(`${coreProject} (${repos.length.toLocaleString()} repos)`, "success"),
    (coreProject) => log(coreProject, "warn"),
    "github-repos",
  );
  deindent();

  if (repos.length)
    log(
      `Got repos for ${repos.length.toLocaleString()} core projects`,
      "success",
    );
  if (repoErrors.length)
    log(
      `Problem getting repos for ${repoErrors.length.toLocaleString()} core projects`,
      "warn",
    );

  type Issue = (typeof repos)[number]["value"][number]["issues"][number];
  type PullRequest =
    (typeof repos)[number]["value"][number]["pull_requests"][number];

  /** transform issue (or pull request, which gh considers sub-type of issue) */
  const mapIssue = (issue: Issue | PullRequest) => ({
    state: issue.state,
    state_reason: "state_reason" in issue ? issue.state_reason : "",
    created: issue.created_at,
    updated: issue.updated_at,
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
  const transformedRepos = repos
    .map((repo) => repo.value)
    .flat()
    .map((repo) => ({
      core_project: repo.core_project,
      id: repo.id,
      owner: repo.owner?.login ?? "",
      name: repo.name,
      description: repo.description ?? "",
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
      created: repo.created_at,
      modified: repo.pushed_at,
      language: repo.language ?? "",
      license: repo.license?.name ?? "",
      readme: repo.readme,
      contributing: repo.contributing,
      dependencies: Object.fromEntries(
        repo.dependencies.repository.dependencyGraphManifests?.nodes?.map(
          (node) => [
            /**
             * get manifest file path (e.g. requirements.txt, yarn.lock).
             * format: /OWNER/REPO/blob/BRANCH/PATH-TO-FILE
             */
            (node?.blobPath ?? "").split("/").slice(5).join("/"),
            /** number of dependencies */
            node?.dependenciesCount ?? 0,
          ],
        ) ?? [],
      ),
    }));

  return transformedRepos;
};