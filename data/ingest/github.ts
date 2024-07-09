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
      const repos = (
        await octokit.rest.search.repos({ q: `topic:${coreProject}` })
      ).data.items;
      return repos.map((repo) => ({ core_project: coreProject, ...repo }));
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
      owner: repo.owner?.name ?? repo.owner?.login,
      name: repo.name,
      stars: repo.stargazers_count,
      forks: repo.forks,
      watchers: repo.watchers,
      issues: repo.open_issues,
      modified: repo.pushed_at,
      language: repo.language,
    }));

  return transformedRepos;
};
