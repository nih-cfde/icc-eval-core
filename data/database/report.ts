import { groupBy, mapValues, sum } from "lodash-es";
import { db } from ".";

export const getCoreProjects = async () => {
  const publicationsPerCoreProject = await getPublicationsPerCoreProject();
  return mapValues(
    groupBy(
      await db.selectFrom("project").selectAll().execute(),
      "core_project",
    ),
    (projects, coreProject) => ({
      id: coreProject,
      name: projects[0]?.name ?? "",
      activity_code: projects[0]?.activity_code ?? "",
      projects: projects.map((project) => project.id),
      award_amount: sum(projects.map((project) => project.award_amount)),
      publications: publicationsPerCoreProject[coreProject]?.length ?? 0,
    }),
  );
};

export const getPublicationsPerCoreProject = async () =>
  mapValues(
    groupBy(
      await db.selectFrom("publication").selectAll().execute(),
      "core_project",
    ),
    (project) =>
      project.map((row) => ({ ...row, authors: row.authors.split(", ") })),
  );
