import { Octokit, type RequestError } from "octokit";
import { type Repository } from "@octokit/graphql-schema";
import { throttling } from "@octokit/plugin-throttling";
import { log } from "@/util/log";

const { GITHUB_TOKEN } = process.env;

/** number of times to retry after being rate limited */
const retries = 4;
/** multiply retry wait time for extra safety */
const waitFactor = 2;

if (!GITHUB_TOKEN)
  log(
    "No GitHub token provided. Anonymous requests may be slower or fail.",
    "warn",
  );

/** use provided rate-limiting middleware */
const withPlugins = Octokit.plugin(throttling);

/** github rest api client */
export const octokit = new withPlugins({
  auth: GITHUB_TOKEN,
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

/** maximum allowed page size */
const maxPage = 100;

/** search for repos that have topic */
export const searchRepos = async (topic: string) =>
  (await octokit.rest.search.repos({ q: `topic:${topic}` })).data.items;

/** get commits for repo */
export const getCommits = (owner: string, name: string) =>
  octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo: name,
    per_page: maxPage,
  });

/** get stars for repo */
export const getStars = (owner: string, name: string) =>
  octokit.paginate(octokit.rest.activity.listStargazersForRepo, {
    owner,
    repo: name,
    per_page: maxPage,
    /** https://docs.github.com/en/rest/activity/starring?apiVersion=2022-11-28#list-stargazers */
    headers: { accept: "application/vnd.github.star+json" },
  });

/**
 * watchers over time not possible
 * https://stackoverflow.com/questions/71090557/github-api-number-of-watch-over-time
 */

/** get forks for repo */
export const getForks = (owner: string, name: string) =>
  octokit.paginate(octokit.rest.repos.listForks, {
    owner,
    repo: name,
    per_page: maxPage,
  });

/** get issues for repo */
export const getIssues = async (owner: string, name: string) =>
  (
    await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner,
      repo: name,
      state: "all",
    })
  ).filter((issue) => !issue.pull_request);

/** get pull requests for repo */
export const getPullRequests = (owner: string, name: string) =>
  octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo: name,
    state: "all",
  });

/** check whether file exists in repo */
export const fileExists = async (owner: string, name: string, path: string) => {
  try {
    await octokit.rest.repos.getContent({
      owner,
      repo: name,
      path,
    });
    return true;
  } catch (error) {
    /** https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content--status-codes */
    const status = (error as RequestError).status;
    if (status === 302) return true;
    if (status === 404) return false;
    throw Error(
      `Problem getting contents for repo ${owner}/${name}, status ${status}`,
    );
  }
};

/** get contributors to repo */
export const getContributors = (owner: string, name: string) =>
  octokit.paginate(octokit.rest.repos.listContributors, { owner, repo: name });

/** get programming languages used in repo */
export const getLanguages = async (owner: string, name: string) =>
  (
    await octokit.rest.repos.listLanguages({
      owner,
      repo: name,
    })
  ).data;

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
export const getDependencies = (owner: string, name: string) =>
  /** https://github.com/orgs/community/discussions/118753 */
  octokit.graphql<{ repository: Repository }>(dependencyQuery, {
    owner,
    repo: name,
  });
