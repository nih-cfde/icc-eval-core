import type { Insertable } from "kysely";
import type { Opportunity } from "./opportunities";
import type { Project } from "./projects";

export type Database = {
  opportunity: Insertable<Opportunity>;
  project: Insertable<Project>;
};
