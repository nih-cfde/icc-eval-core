import { queryReporter } from "./reporter";
import type { ProjectsQuery } from "./reporter-projects-query";
import type { ProjectsResults } from "./reporter-projects-results";
import type { Project } from "../database/projects";

/** get grant projects associated with funding opportunities */
export const getProjects = async (
  opportunities: string[],
): Promise<Project[]> => {
  const { results } = await queryReporter<ProjectsQuery, ProjectsResults>(
    "projects",
    { criteria: { opportunity_numbers: opportunities } },
  );

  return results.map((result) => ({
    id: result.project_num ?? "",
    core_project: result.core_project_num ?? "",
    name: result.project_title ?? "",
    opportunity: result.opportunity_number ?? "",
    application: result.appl_id ?? 0,
    award_amount: result.award_amount ?? 0,
    activity_code: result.activity_code ?? "",
    agency_code: result.agency_code ?? "",
    date_start: result.project_start_date ?? "",
    date_end: result.project_end_date ?? "",
    is_active: result.is_active ? 1 : 0,
  }));
};
