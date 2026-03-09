import type analyticsOverview from "~/analytics-overview.json";
import type analytics from "~/analytics.json";
import type coreProjects from "~/core-projects.json";
import type repoOverview from "~/repo-overview.json";
import type repos from "~/repos.json";

const { VITE_API: api } = import.meta.env;

export const loginLink = `${api}/accounts/orcid/login/`;
export const logoutLink = `${api}/accounts/logout/`;

const request = async <Results>(endpoint: string) => {
  const url = new URL(`${api}/${endpoint}/`);
  url.searchParams.set("limit", "999");
  const headers = { "Content-Type": "application/json" };
  const options: RequestInit = { credentials: "include", headers };
  const response = await window.fetch(url, options);
  /** if simply not logged in, fail gracefully */
  if (response.status === 401) return;
  if (!response.ok) throw new Error(`Response not OK`);
  const { results } = (await response.json()) as Response<Results>;
  return results;
};

export const getMe = () =>
  request<{
    username: string;
    firstName: string;
    lastName: string;
    orcid: string;
  }>("me");

type Response<Results> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Results;
};

export const getCoreProjects = () =>
  request<typeof coreProjects>("core-projects");

export const getRepos = () => request<typeof repos>("repositories");

export const getRepoOverview = () =>
  request<typeof repoOverview>("repo-overview");

export const getAnalytics = () => request<typeof analytics>("analytics");

export const getAnalyticsOverview = () =>
  request<typeof analyticsOverview>("analytics-overview");
