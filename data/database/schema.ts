import type { Insertable } from "kysely";
import type { Journal } from "@/database/journals";
import type { Opportunity } from "./opportunities";
import type { Project } from "./projects";
import type { Publication } from "./publications";

export type Database = {
  opportunity: Insertable<Opportunity>;
  project: Insertable<Project>;
  publication: Insertable<Publication>;
  journal: Insertable<Journal>;
};
