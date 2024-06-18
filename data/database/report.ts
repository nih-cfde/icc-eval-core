import { groupBy, mapValues } from "lodash-es";
import { db } from ".";

export const getPublicationsPerCoreProject = async () =>
  mapValues(
    groupBy(
      await db.selectFrom("publication").selectAll().execute(),
      "core_project",
    ),
    (project) =>
      project.map((row) => ({ ...row, authors: row.authors.split(", ") })),
  );
