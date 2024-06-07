import { Insertable } from "kysely";
import { Opportunity } from "./opportunities";
import { Project } from "./projects";

export type Database = {
  opportunity: Insertable<Opportunity>;
  project: Insertable<Project>;
};
