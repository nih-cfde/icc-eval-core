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

/** search for repos that have topic */
export const searchRepos = memoize(async (topic: string) => {
  const repos = await octokit.paginate(octokit.rest.search.repos, {
    q: `topic:${topic}`,
  });

  /** if flag set, get all other repos in org */
  const orgRepos = (
    await Promise.all(
      uniq(
        repos
          .filter((repo) => repo.topics?.includes("tag-all"))
          .map((repo) => repo.owner?.login ?? ""),
      )
        .filter(Boolean)
        .map((org) => octokit.paginate(octokit.rest.repos.listForOrg, { org })),
    )
  ).flat();

  return uniqBy([...repos, ...orgRepos], "id");
});

/** get commits for repo */
export const getCommits = memoize(async (owner: string, repo: string) =>
  (await octokit.paginate(octokit.rest.repos.listCommits, { owner, repo })).map(
    (commit) =>
      /** only keep potentially useful fields */
      ({
        sha: commit.sha,
        commit: {
          committer: {
            date: commit.commit.committer?.date,
          },
        },
      }),
  ),
);

/** get stars for repo */
export const getStars = memoize(async (owner: string, repo: string) =>
  (
    await octokit.paginate(octokit.rest.activity.listStargazersForRepo, {
      owner,
      repo,
      /** https://docs.github.com/en/rest/activity/starring?apiVersion=2022-11-28#list-stargazers */
      headers: { accept: "application/vnd.github.star+json" },
    })
  )
    /** only keep potentially useful fields */
    .map((star) => ({
      id: "id" in star ? star.id : undefined,
      login: "login" in star ? star.login : undefined,
      name: "name" in star ? star.name : undefined,
      starred_at: star.starred_at,
    })),
);

/**
 * watchers over time not possible
 * https://stackoverflow.com/questions/71090557/github-api-number-of-watch-over-time
 */

/** get forks for repo */
export const getForks = memoize(async (owner: string, repo: string) =>
  (await octokit.paginate(octokit.rest.repos.listForks, { owner, repo }))
    /** only keep potentially useful fields */
    .map((fork) => ({
      id: fork.id,
      name: fork.name,
      full_name: fork.full_name,
      created_at: fork.created_at,
    })),
);

/** get issues for repo */
export const getIssues = memoize(async (owner: string, repo: string) =>
  (
    await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner,
      repo,
      state: "all",
    })
  )
    .filter((issue) => !issue.pull_request)
    /** only keep potentially useful fields */
    .map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      state_reason: issue.state_reason,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      labels: issue.labels,
    })),
);

/** get pull requests for repo */
export const getPullRequests = memoize(async (owner: string, repo: string) =>
  (
    await octokit.paginate(octokit.rest.pulls.list, {
      owner,
      repo,
      state: "all",
    })
  )
    /** only keep potentially useful fields */
    .map((pullRequest) => ({
      id: pullRequest.id,
      number: pullRequest.number,
      title: pullRequest.title,
      state: pullRequest.state,
      state_reason:
        "state_reason" in pullRequest ? pullRequest.state_reason : undefined,
      created_at: pullRequest.created_at,
      updated_at: pullRequest.updated_at,
      closed_at: pullRequest.closed_at,
      labels: pullRequest.labels,
    })),
);

/** check whether file exists in repo */
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
        `Problem getting contents for repo ${owner}/${repo}, status ${status}`,
      );
    }
  },
);

/** get contributors to repo */
export const getContributors = memoize(async (owner: string, repo: string) =>
  (await octokit.paginate(octokit.rest.repos.listContributors, { owner, repo }))
    /** only keep potentially useful fields */
    .map((contributor) => ({
      id: contributor.id,
      login: contributor.login,
      name: contributor.name,
      contributions: contributor.contributions,
    })),
);

/** get programming languages used in repo */
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
