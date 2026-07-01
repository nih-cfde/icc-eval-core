import { uniq, uniqBy } from "lodash-es";
import { Octokit, type RequestError } from "octokit";
import { type Repository } from "@octokit/graphql-schema";
import { throttling } from "@octokit/plugin-throttling";
import { log } from "@/util/log";
import { memoize } from "@/util/memoize";

const { AUTH_GITHUB } = process.env;

/** number of times to retry after being rate limited */
const retries = 4;
/** multiply retry wait time for extra safety */
const waitFactor = 2;

/** use provided rate-limiting middleware */
const withPlugins = Octokit.plugin(throttling);

/** github rest api client */
export const octokit = new withPlugins({
  auth: AUTH_GITHUB,
  /** https://github.com/octokit/plugin-throttling.js */
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      log(`Request quota exhausted for request`, "warn");

      if (retryCount <= retries) {
        log(`Retrying in ${retryAfter}s, retry ${retryCount + 1}`, "warn");
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options) => {
      log(`SecondaryRateLimit detected for request ${options.url}`, "warn");
    },
  },

  retryAfterBaseValue: waitFactor * 1000,
});

/** check if authenticated */
try {
  await octokit.rest.users.getAuthenticated();
} catch (error) {
  console.warn("No GitHub auth. Requests might take longer or fail.");
}

/** increase page size */
octokit.request = octokit.request.defaults({ per_page: 100 });

/** search for repositories that have topic */
export const searchRepositories = memoize(async (topic: string) => {
  const repositories = await octokit.paginate(octokit.rest.search.repos, {
    q: `topic:${topic}`,
  });

  /** if flag set, get all other repositories in organization */
  const organizationRepositories = (
    await Promise.all(
      uniq(
        repositories
          .filter((repository) => repository.topics?.includes("tag-all"))
          .map((repository) => repository.owner?.login ?? ""),
      )
        .filter(Boolean)
        .map((org) => octokit.paginate(octokit.rest.repos.listForOrg, { org })),
    )
  ).flat();

  return uniqBy(
    [...repositories, ...organizationRepositories],
    (repository) => repository.id,
  );
});

/**
 * get all top-level details for repository. returns everything that repository
 * search returns, plus extra fields, including subscribers_count (watchers).
 */
export const getRepository = memoize(
  async (owner: string, repo: string) =>
    (await octokit.rest.repos.get({ owner, repo })).data,
);

/** get commits for repository */
export const getCommits = memoize((owner: string, repo: string) =>
  octokit.paginate(octokit.rest.repos.listCommits, { owner, repo }),
);

/** get stars for repository */
export const getStars = memoize((owner: string, repo: string) =>
  octokit.paginate(octokit.rest.activity.listStargazersForRepo, {
    owner,
    repo,
    /** https://docs.github.com/en/rest/activity/starring?apiVersion=2022-11-28#list-stargazers */
    headers: { accept: "application/vnd.github.star+json" },
  }),
);

/**
 * watchers over time not possible
 * https://stackoverflow.com/questions/71090557/github-api-number-of-watch-over-time
 */

/** get forks for repository */
export const getForks = memoize((owner: string, repo: string) =>
  octokit.paginate(octokit.rest.repos.listForks, { owner, repo }),
);

/** get issues for repository */
export const getIssues = memoize(async (owner: string, repo: string) =>
  (
    await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner,
      repo,
      state: "all",
    })
  ).filter((issue) => !issue.pull_request),
);

/** get pull requests for repository */
export const getPullRequests = memoize(
  async (owner: string, repo: string) =>
    await octokit.paginate(octokit.rest.pulls.list, {
      owner,
      repo,
      state: "all",
    }),
);

/** check if repository has readme */
export const hasReadme = memoize(async (owner: string, repo: string) => {
  try {
    await octokit.rest.repos.getReadme({ owner, repo });
    return true;
  } catch (error) {
    /** https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-a-repository-readme--status-codes */
    const status = (error as RequestError).status;
    if (status === 404) return false;
    throw Error(
      `Unexpected problem getting readme for repository ${owner}/${repo}, status ${status}`,
      { cause: error },
    );
  }
});

/** check whether file exists in repository */
export const fileExists = memoize(
  async (owner: string, repo: string, path: string) => {
    try {
      await octokit.rest.repos.getContent({ owner, repo, path });
      return true;
    } catch (error) {
      /** https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content--status-codes */
      const status = (error as RequestError).status;
      if (status === 302) return true;
      if (status === 404) return false;
      throw Error(
        `Unexpected problem getting contents for repository ${owner}/${repo}, status ${status}`,
        { cause: error },
      );
    }
  },
);

/** get contributors to repository */
export const getContributors = memoize((owner: string, repo: string) =>
  octokit.paginate(octokit.rest.repos.listContributors, {
    owner,
    repo,
  }),
);

/** get programming languages used in repository */
export const getLanguages = memoize(
  async (owner: string, repo: string) =>
    (await octokit.rest.repos.listLanguages({ owner, repo })).data,
);

/**
 * graph ql query to get dependency count. need to include "dependencies" too,
 * or else "dependenciesCount" will be 0.
 */
const dependencyQuery = `
  query dependencyTree($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      dependencyGraphManifests {
        nodes {
          blobPath
          dependenciesCount
          dependencies {
            nodes {
              packageName
            }
          }
        }
      }
    }
  }
`;

/** get dependency graph */
export const getDependencies = memoize((owner: string, repo: string) =>
  /** https://github.com/orgs/community/discussions/118753 */
  octokit.graphql<{ repository: Repository }>(dependencyQuery, { owner, repo }),
);
