import { octokit } from "@/api/github";
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
      /** search for all repos tagged with core project number */
      const repos = (
        await octokit.rest.search.repos({ q: `topic:${coreProject}` })
      ).data.items;

      /** for each repo */
      return await Promise.all(
        repos.map(async (repo) => ({
          /** associated core project number */
          core_project: coreProject,

          /** top-level repo details */
          ...repo,

          /** get all commits in repo */
          commits: await octokit.paginate(octokit.rest.repos.listCommits, {
            owner: repo.owner?.login ?? "",
            repo: repo.name,
            per_page: 100,
          }),

          /** get all stars of repo */
          stars: await octokit.paginate(
            octokit.rest.activity.listStargazersForRepo,
            {
              owner: repo.owner?.login ?? "",
              repo: repo.name,
              per_page: 100,
              /** https://docs.github.com/en/rest/activity/starring?apiVersion=2022-11-28#list-stargazers */
              headers: { accept: "application/vnd.github.star+json" },
            },
          ),

          /** get all watchers of repo */
          /**
           * watchers over time not possible
           * https://stackoverflow.com/questions/71090557/github-api-number-of-watch-over-time
           */

          /** get all forks of repo */
          forks: await octokit.paginate(octokit.rest.repos.listForks, {
            owner: repo.owner?.login ?? "",
            repo: repo.name,
            per_page: 100,
          }),
        })),
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
    log(`Got ${repos.length.toLocaleString()} repos`, "success");
  if (repoErrors.length)
    log(`Problem getting ${repoErrors.length.toLocaleString()} repos`, "warn");

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
      issues: repo.open_issues,
      created: repo.created_at,
      modified: repo.pushed_at,
      language: repo.language ?? "",
      license: repo.license?.name ?? "",
    }));

  return transformedRepos;
};
