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
import { allSettled } from "@/util/request";

export const getRepos = async (coreProjects: string[]) => {
  log(
    `Getting repos for ${coreProjects.length.toLocaleString()} core projects`,
  );

  indent();
  /** run in parallel */
  const { results: repos, errors: repoErrors } = await allSettled(
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

            /** top-level details */
            ...repo,

            /** get all commits */
            commits: await getCommits(owner, name),

            /** get all stars */
            stars: await getStars(owner, name),

            /** get all watchers */
            /**
             * watchers over time not possible
             * https://stackoverflow.com/questions/71090557/github-api-number-of-watch-over-time
             */

            /** get all forks */
            forks: await getForks(owner, name),

            /** get all issues */
            issues: await getIssues(owner, name),

            /** get all pull requests */
            pull_requests: await getPullRequests(owner, name),

            /** get presence of readme.md */
            readme: await fileExists(owner, name, "README.md"),

            /** get presence of contributing.md */
            contributing: await fileExists(owner, name, "CONTRIBUTING.md"),

            /** get contributors */
            contributors: await getContributors(owner, name),

            /** get dependencies */
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
      commits: repo.commits.map(
        (commit) =>
          commit.commit.committer?.date ?? commit.commit.author?.date ?? "",
      ),
      stars: repo.stars.map((star) => star.starred_at ?? ""),
      watchers: repo.watchers,
      forks: repo.forks.map((fork) => fork.created_at ?? ""),
      issues: repo.issues.map((issue) => ({
        state: issue.state,
        state_reason: issue.state_reason,
        created: issue.created_at,
        updated: issue.updated_at,
        closed: issue.closed_at,
        labels: issue.labels.map((label) =>
          typeof label === "string" ? label : label.name,
        ),
      })),
      pull_requests: repo.pull_requests.map((pull_request) => ({
        state: pull_request.state,
        created: pull_request.created_at,
        updated: pull_request.updated_at,
        closed: pull_request.closed_at,
        labels: pull_request.labels.map((label) =>
          typeof label === "string" ? label : label.name,
        ),
      })),
      created: repo.created_at,
      modified: repo.pushed_at,
      language: repo.language ?? "",
      license: repo.license?.name ?? "",
      readme: repo.readme,
      contributing: repo.contributing,
      contributors: repo.contributors.map((contributor) => ({
        name: contributor.login ?? contributor.name ?? "",
        contributions: contributor.contributions,
      })),
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
