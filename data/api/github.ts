import { Octokit, type RequestError } from "octokit";
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
      `Couldn't get contents for repo ${owner}/${name}, status ${status}`,
    );
  }
};
