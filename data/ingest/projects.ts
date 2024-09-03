import { sum, uniq, uniqBy } from "lodash-es";
import { queryReporter } from "@/api/reporter";
import type { ProjectsQuery } from "@/api/types/reporter-projects-query";
import type { ProjectsResults } from "@/api/types/reporter-projects-results";
import { log } from "@/util/log";
import { query } from "@/util/request";
import { count } from "@/util/string";

/** get grant projects associated with funding opportunities */
export const getProjects = async (opportunities: string[]) => {
  log(`Getting projects for ${count(opportunities)} opportunities`);

  /** get projects associated with opportunities */
  const reporter = await query(
    () =>
      queryReporter<ProjectsQuery, ProjectsResults>("projects", {
        criteria: { opportunity_numbers: opportunities },
      }),
    "reporter-projects.json",
  );

  /** extract results */
  let projects = reporter?.results ?? [];

  /** de-dupe */
  projects = uniqBy(projects, (project) => project.project_num);

  /** transform data into desired format, with fallbacks */
  const transformedProjects = projects.map((project) => ({
    id: project.project_num ?? "",
    coreProject: project.core_project_num ?? "",
    name: project.project_title ?? "",
    opportunity: project.opportunity_number ?? "",
    application: project.appl_id ?? 0,
    awardAmount: project.award_amount ?? 0,
    activityCode: project.activity_code ?? "",
    agencyCode: project.agency_code ?? "",
    dateStart: project.project_start_date ?? "",
    dateEnd: project.project_end_date ?? "",
    isActive: project.is_active ? 1 : 0,
  }));

  /** get core projects */
  const transformedCoreProjects = uniq(
    transformedProjects.map((project) => project.coreProject),
  ).map((coreProjectId) => {
    /** get matching projects */
    const projects = transformedProjects.filter(
      (project) => project.coreProject === coreProjectId,
    )!;

    return {
      id: coreProjectId,
      name: projects[0]!.name,
      activityCode: projects[0]!.activityCode,
      projects: projects.map((project) => project.id),
      awardAmount: sum(projects.map((project) => project.awardAmount)),
      publications: 0,
      repos: 0,
      analytics: 0,
    };
  });

  return {
    coreProjects: transformedCoreProjects,
    projects: transformedProjects,
  };
};
