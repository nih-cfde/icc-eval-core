import type { Ref } from "vue";
import { event } from "vue-gtag";
import { sum } from "lodash";
import { useQuery } from "@tanstack/vue-query";
import analyticsOverview from "./types/analytics-overview.json";
import analytics from "./types/analytics.json";
import coreProjects from "./types/core-projects.json";
import drcCode from "./types/drc-code.json";
import drcDcc from "./types/drc-dcc.json";
import drcFile from "./types/drc-file.json";
import journals from "./types/journals.json";
import projects from "./types/projects.json";
import publications from "./types/publications.json";
import repoOverview from "./types/repo-overview.json";
import repos from "./types/repos.json";

const { VITE_API: api, VITE_USE_MOCK: useMock } = import.meta.env;

/** whether to use fake data */
// if useMock is not set, default to true
const mock = useMock === undefined ? true : useMock === "true";

/** link to SSO login */
export const loginLink = `${api}/accounts/orcid/login/`;
/** link to SSO logout */
export const logoutLink = `${api}/accounts/logout/`;

/** value to represent not-logged-in or un-authed response */
export const notAuthed = null;

/** generic request func */
const request = async <Results>(
  endpoint: string,
  params: Record<string, unknown> = {},
) => {
  const url = new URL(`${api}/api/${endpoint}/`);
  Object.entries(params).forEach(([key, value]) =>
    value !== undefined && url.searchParams.set(key, String(value)),
  );
  const headers = { "Content-Type": "application/json" };
  const options: RequestInit = { credentials: "include", headers };
  const response = await window.fetch(url, options);
  /** if not authorized, fail gracefully */
  if (response.status === 401) return notAuthed;
  if (!response.ok) throw new Error(`Response not OK`);
  event(`api_${endpoint}`, { params });
  /** paginated */
  if ("limit" in params)
    return ((await response.json()) as Paginated<Results>).results;
  /** un-paginated */
  return (await response.json()) as Results;
};

/** get auth'd user */
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

/** get core project data from api */
export const getCoreProjects = async (coreProject?: string) => {
  const data = mock
    ? coreProjects
    : await request<typeof coreProjects>("core-projects", {
        limit: 999,
        coreProject,
      });
  if (data === notAuthed) return notAuthed;
  return data.map((coreProject) => ({
    ...coreProject,
    /** derive extra props */
    reposAnalytics: coreProject.repos + coreProject.analytics,
  }));
};

/** get project data from api */
export const getProjects = async (coreProject?: string) => {
  const data = mock
    ? projects
    : await request<typeof projects>("projects", {
        limit: 999,
        all: true,
        coreProject,
      });
  if (data === notAuthed) return notAuthed;
  return data.map((project) => ({
    ...project,
    /** derive extra props */
    dateStart: new Date(project.dateStart),
  }));
};

/** get publication data from api */
export const getPublications = async (
  coreProject?: string,
  journalList?: typeof journals,
) => {
  const data = mock
    ? publications
    : await request<typeof publications>("publications", {
        limit: 999,
        all: true,
        coreProject,
      });
  if (data === notAuthed) return notAuthed;
  return data.map((publication) => {
    /** look up (possibly multiple) journals matching publication */
    const journalMatches = journalList?.filter((journal) =>
      [journal.abbrev, journal.name, journal.title]
        .map((prop) => prop.toLowerCase())
        .includes(publication.journal.toLowerCase()),
    );

    /** if multiple matches, use nothing to avoid false association/data */
    const journal =
      journalMatches?.length === 1 ? journalMatches[0] : undefined;

    return {
      ...publication,
      /** derive extra props */
      modified: new Date(publication.modified),
      rank: journal?.rank ?? 0,
      journal: journal?.name ?? publication.journal,
    };
  });
};

/** get journal data from api */
export const getJournals = () =>
  mock ? journals : request<typeof journals>("journals", { limit: 999 });

/** get analytics data from api */
export const getAnalytics = (coreProject?: string) =>
  mock
    ? analytics
    : request<typeof analytics>("analytics", {
        limit: 999,
        all: true,
        coreProject,
      });

/** get analytics overview data from api */
export const getAnalyticsOverview = () =>
  mock
    ? analyticsOverview
    : request<typeof analyticsOverview>("analytics-overview");

/** get repo data from api */
export const getRepos = async (coreProject?: string) => {
  const data = mock
    ? repos
    : await request<typeof repos>("repositories", {
        limit: 999,
        all: true,
        coreProject,
      });
  if (data === notAuthed) return notAuthed;
  return data.map((repo) => ({
    ...repo,
    /** derive extra props */
    modified: new Date(repo.modified),
    dependencyTotal: sum(Object.values(repo.dependencies)),
    ...repo.dependencies,
  }));
};

/** get repo overview data from api */
export const getRepoOverview = () =>
  mock ? repoOverview : request<typeof repoOverview>("repo-overview");

/** get drc data from api */
export const getDrcData = async () => {
  const data = mock
    ? { code: drcCode, dcc: drcDcc, file: drcFile }
    : await request<{
        code: typeof drcCode;
        dcc: typeof drcDcc;
        file: typeof drcFile;
      }>("drc");

  return data;
};

export type DRC = typeof drcCode | typeof drcDcc | typeof drcFile;

/** load and use core project data */
export const useCoreProjects = (coreProject?: Ref<string | undefined>) =>
  useQuery({
    queryKey: ["getCoreProjects", coreProject],
    queryFn: () => getCoreProjects(coreProject?.value),
  });

/** load and use project data */
export const useProjects = (coreProject?: Ref<string | undefined>) =>
  useQuery({
    queryKey: ["getProjects", coreProject],
    queryFn: () => getProjects(coreProject?.value),
  });

/** load and use publication data */
export const usePublications = (coreProject?: Ref<string | undefined>) => {
  const { data: journals } = useJournals();
  return useQuery({
    queryKey: ["getPublications", coreProject, journals],
    queryFn: () => getPublications(coreProject?.value, journals.value ?? []),
  });
};

/** load and use journal data */
export const useJournals = () =>
  useQuery({
    queryKey: ["getJournals"],
    queryFn: getJournals,
  });

/** load and use analytics data */
export const useAnalytics = (coreProject?: Ref<string | undefined>) =>
  useQuery({
    queryKey: ["getAnalytics", coreProject],
    queryFn: () => getAnalytics(coreProject?.value),
  });

/** load and use analytics overview data */
export const useAnalyticsOverview = () =>
  useQuery({
    queryKey: ["getAnalyticsOverview"],
    queryFn: getAnalyticsOverview,
  });

/** load and use repo data */
export const useRepos = (coreProject?: Ref<string | undefined>) =>
  useQuery({
    queryKey: ["getRepos", coreProject],
    queryFn: () => getRepos(coreProject?.value),
  });

/** load and use repo overview data */
export const useRepoOverview = () =>
  useQuery({
    queryKey: ["getRepoOverview"],
    queryFn: getRepoOverview,
  });

/** load and use drc data */
export const useDrcData = () =>
  useQuery({
    queryKey: ["getDrcData"],
    queryFn: getDrcData,
  });
