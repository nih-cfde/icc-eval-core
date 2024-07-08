import type { components } from "@octokit/openapi-types";
import { octokit } from "@/api/github";
import { loadJson, saveJson } from "@/util/file";
import { deindent, indent, log } from "@/util/log";
import { allSettled } from "@/util/request";

const { RAW_PATH } = process.env;

export const getRepos = async (coreProjects: string[]) => {
  /** filename for raw data */
  const filename = "github-repos";

  /** extract types of rest results */
  type SearchResult = components["schemas"]["repo-search-result-item"] & {
    core_project: string;
  };

  let repoResults: SearchResult[] = [];

  /** if raw data already exists, return that without querying */
  const raw = await loadJson<SearchResult[]>(RAW_PATH, filename);
  if (raw) repoResults = raw;
  else {
    indent();
    /** run in parallel */
    const { results } = await allSettled(
      coreProjects,
      async (coreProject) => {
        const repo = (
          await octokit.rest.search.repos({ q: `topic:${coreProject}` })
        ).data.items[0];
        if (!repo) throw Error("Repo not found");
        return { ...repo, core_project: coreProject };
      },
      (coreProject) => log(coreProject, "start"),
      (coreProject) => log(coreProject, "success"),
      (coreProject) => log(coreProject, "warn"),
    );
    deindent();

    repoResults = results.map((repoResult) => repoResult.value);
  }

  /** save raw data */
  saveJson(repoResults, RAW_PATH, filename);

  return repoResults;
};
