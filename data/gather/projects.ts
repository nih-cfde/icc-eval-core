import { sum, uniq, uniqBy } from "lodash-es";
import { queryReporter } from "@/api/reporter";
import type { ProjectsQuery } from "@/api/types/reporter-projects-query";
import type { ProjectsResults } from "@/api/types/reporter-projects-results";
import manualCoreProjects from "@/manual/core-projects.json";
import { log } from "@/util/log";
import { count } from "@/util/string";

/** get grant projects associated with funding opportunities */
export const getProjects = async (opportunities: string[]) => {
  log(`Getting projects for ${count(opportunities)} opportunities`);

  /** get projects associated with opportunities */
  let reporter = await queryReporter<ProjectsQuery, ProjectsResults>(
    "projects",
    { criteria: { opportunity_numbers: opportunities } },
  );

  /** extract results */
  let projects = reporter.results ?? [];

  log(`Including ${count(manualCoreProjects)} manual core projects`);

  /** get projects associated with manual core projects */
  reporter = await queryReporter<ProjectsQuery, ProjectsResults>("projects", {
    criteria: { project_nums: manualCoreProjects },
  });

  /** extract results */
  projects = projects.concat(reporter.results ?? []);

  /** de-dupe */
  projects = uniqBy(projects, (project) => project.project_num);

  /** transform project data into desired format, with fallbacks */
  const transformedProjects = projects.map((project) => ({
    id: project.project_num ?? "",
    coreProject: project.core_project_num ?? "",
    name: project.project_title ?? "",
    opportunity: project.opportunity_number ?? "",
    application: project.appl_id ?? 0,
    awardAmount: project.award_amount ?? 0,
    fiscalYear: project.fiscal_year ?? 0,
    activityCode: project.activity_code ?? "",
    agencyCode: project.agency_code ?? "",
    dateStart: project.project_start_date ?? "",
    dateEnd: project.project_end_date ?? "",
    isActive: project.is_active ? 1 : 0,
  }));

  /** transform core project data into desired format, with fallbacks */
  const transformedCoreProjects = uniq(
    transformedProjects.map((project) => project.coreProject),
  ).map((coreProjectId) => {
    /** get matching projects */
    const projects = transformedProjects.filter(
      (project) => project.coreProject === coreProjectId,
    )!;

    return {
      id: coreProjectId,
      name: projects[0]?.name ?? "",
      activityCode: projects[0]?.activityCode ?? "",
      projects: projects.map((project) => project.id),
      awardAmount: sum(projects.map((project) => project.awardAmount)),
      publications: 0,
      repositories: 0,
      analytics: 0,
    };
  });

  log(`${count(transformedCoreProjects)} core projects`, "success");
  log(`${count(transformedProjects)} projects`, "success");

  return {
    coreProjects: transformedCoreProjects,
    projects: transformedProjects,
  };
};

export type CoreProjects = Awaited<
  ReturnType<typeof getProjects>
>["coreProjects"];

export type Projects = Awaited<ReturnType<typeof getProjects>>["projects"];
