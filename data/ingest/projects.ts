import { sum, uniq, uniqBy } from "lodash-es";
import { queryReporter } from "@/api/reporter";
import type { ProjectsQuery } from "@/api/reporter-projects-query";
import type { ProjectsResults } from "@/api/reporter-projects-results";
import { log } from "@/util/log";
import { query } from "@/util/request";

/** get grant projects associated with funding opportunities */
export const getProjects = async (opportunities: string[]) => {
  log(
    `Getting projects for ${opportunities.length.toLocaleString()} opportunities`,
  );

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
    core_project: project.core_project_num ?? "",
    name: project.project_title ?? "",
    opportunity: project.opportunity_number ?? "",
    application: project.appl_id ?? 0,
    award_amount: project.award_amount ?? 0,
    activity_code: project.activity_code ?? "",
    agency_code: project.agency_code ?? "",
    date_start: project.project_start_date ?? "",
    date_end: project.project_end_date ?? "",
    is_active: project.is_active ? 1 : 0,
  }));

  /** get core projects */
  const transformedCoreProjects = uniq(
    transformedProjects.map((project) => project.core_project),
  ).map((coreProjectId) => {
    /** get matching projects */
    const projects = transformedProjects.filter(
      (project) => project.core_project === coreProjectId,
    )!;

    return {
      id: coreProjectId,
      name: projects[0]!.name,
      activity_code: projects[0]!.activity_code,
      projects: projects.map((project) => project.id),
      award_amount: sum(projects.map((project) => project.award_amount)),
      publications: 0,
      repos: 0,
    };
  });

  return {
    coreProjects: transformedCoreProjects,
    projects: transformedProjects,
  };
};
