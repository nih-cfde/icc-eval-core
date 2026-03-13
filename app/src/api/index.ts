import type analyticsOverview from "~/analytics-overview.json";
import type analytics from "~/analytics.json";
import type coreProjects from "~/core-projects.json";
import type repoOverview from "~/repo-overview.json";
import type repos from "~/repos.json";

const { VITE_API: api } = import.meta.env;

export const loginLink = `${api}/accounts/orcid/login/`;
export const logoutLink = `${api}/accounts/logout/`;

const request = async <Results>(
  endpoint: string,
  params: Record<string, unknown> = {},
) => {
  const url = new URL(`${api}/api/${endpoint}/`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, String(value)),
  );
  const headers = { "Content-Type": "application/json" };
  const options: RequestInit = { credentials: "include", headers };
  const response = await window.fetch(url, options);
  /** if simply not logged in, fail gracefully */
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Response not OK`);
  const { results } = (await response.json()) as Paginated<Results>;
  return results;
};

export const getMe = () =>
  request<{
    username: string;
    firstName: string;
    lastName: string;
    orcid: string;
  }>("me");

type Paginated<Results> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Results;
};

export const getRepoOverview = () =>
  request<typeof repoOverview>("repo-overview");

export const getAnalyticsOverview = () =>
  request<typeof analyticsOverview>("analytics-overview");

export const getCoreProjects = () =>
  request<typeof coreProjects>("core-projects", { limit: 999 });

export const getRepos = (coreProject: string) =>
  request<typeof repos>("repositories", {
    limit: 999,
    all: true,
    coreProject,
  });

export const getAnalytics = (coreProject: string) =>
  request<typeof analytics>("analytics", {
    limit: 999,
    all: true,
    coreProject,
  });
