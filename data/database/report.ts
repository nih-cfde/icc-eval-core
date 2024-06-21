import { groupBy, mapValues } from "lodash-es";
import { db } from ".";

export const getProjectsPerCoreProject = async () =>
  groupBy(await db.selectFrom("project").selectAll().execute(), "core_project");

export const getPublicationsPerCoreProject = async () =>
  mapValues(
    groupBy(
      await db.selectFrom("publication").selectAll().execute(),
      "core_project",
    ),
    (project) =>
      project.map((row) => ({ ...row, authors: row.authors.split(", ") })),
  );
