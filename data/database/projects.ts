import type { CreateTableBuilder } from "kysely";
import { log } from "@/util/log";
import { db } from ".";

type Bool = 0 | 1;

/** grant project */
export type Project = {
  id: string;
  core_project: string;
  name: string;
  opportunity: string;
  application: number;
  award_amount: number;
  activity_code: string;
  agency_code: string;
  date_start: string;
  date_end: string;
  is_active: Bool;
};

/** project table */
const schema: CreateTableBuilder<"project", keyof Project> = db.schema
  .createTable("project")
  .ifNotExists()
  .addColumn("id", "text", (c) => c.primaryKey())
  .addColumn("core_project", "text", (c) => c.notNull())
  .addColumn("name", "text", (c) => c.notNull())
  .addColumn("opportunity", "text", (c) => c.references("opportunity.id"))
  .addColumn("application", "integer", (c) => c.notNull())
  .addColumn("award_amount", "integer", (c) => c.notNull())
  .addColumn("activity_code", "text", (c) => c.notNull())
  .addColumn("agency_code", "text", (c) => c.notNull())
  .addColumn("date_start", "text", (c) => c.notNull())
  .addColumn("date_end", "text", (c) => c.notNull())
  .addColumn("is_active", "integer", (c) => c.notNull());

await schema.execute();

/** add projects to db */
export const addProjects = async (projects: Project[]) => {
  log("info", "Adding projects to db");
  await db
    .insertInto("project")
    .values(projects)
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => {
        const keys = Object.keys(projects[0]!) as (keyof Project)[];
        return Object.fromEntries(keys.map((key) => [key, eb.ref(key)]));
      }),
    )
    .execute();
};
