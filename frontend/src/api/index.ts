import type {
  Analytics,
  AnalyticsOverview,
} from "../../../data/gather/analytics";
import type { CoreProjects } from "../../../data/gather/projects";
import type { Repos, ReposOverview } from "../../../data/gather/repos";

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
  /** paginated */
  if ("limit" in params)
    return ((await response.json()) as Paginated<Results>).results;
  /** un-paginated */
  return (await response.json()) as Results;
};

export const getMe = () =>
  request<{
    username: string;
    firstName: string;
    lastName: string;
    orcid: string;
    isStaff: boolean;
    isSuperuser: boolean;
  }>("me");

type Paginated<Results> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Results;
};

export const getRepoOverview = () => request<ReposOverview>("repo-overview");

export const getAnalyticsOverview = () =>
  request<AnalyticsOverview>("analytics-overview");

export const getCoreProjects = () =>
  request<CoreProjects>("core-projects", {
    limit: 999,
  });

export const getRepos = (coreProject: string) =>
  request<Repos>("repositories", {
    limit: 999,
    all: true,
    coreProject,
  });

export const getAnalytics = (coreProject: string) =>
  request<Analytics>("analytics", {
    limit: 999,
    all: true,
    coreProject,
  });
