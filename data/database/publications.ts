import type { CreateTableBuilder } from "kysely";
import { log } from "@/util/log";
import { db } from ".";

/** publication */
export type Publication = {
  id: number;
  core_project: string;
  application: number;
  title: string;
  authors: string;
  journal: string;
  year: number;
  modified: string;
  doi: string;
  relative_citation_ratio: number;
  citations: number;
  citations_per_year: number;
};

/** publication table */
const schema: CreateTableBuilder<"publication", keyof Publication> = db.schema
  .createTable("publication")
  .ifNotExists()
  .addColumn("id", "integer", (c) => c.primaryKey())
  .addColumn("core_project", "text", (c) => c.notNull())
  .addColumn("application", "integer", (c) => c.notNull())
  .addColumn("title", "text", (c) => c.notNull())
  .addColumn("authors", "text", (c) => c.notNull())
  .addColumn("journal", "text", (c) => c.notNull())
  .addColumn("year", "integer", (c) => c.notNull())
  .addColumn("modified", "text", (c) => c.notNull())
  .addColumn("doi", "text", (c) => c.notNull())
  .addColumn("relative_citation_ratio", "real", (c) => c.notNull())
  .addColumn("citations", "real", (c) => c.notNull())
  .addColumn("citations_per_year", "real", (c) => c.notNull());

await schema.execute();

/** add publications to db */
export const addPublications = async (publications: Publication[]) => {
  log("Adding publications to db");
  await db
    .insertInto("publication")
    .values(publications)
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => {
        const keys = Object.keys(publications[0]!) as (keyof Publication)[];
        return Object.fromEntries(keys.map((key) => [key, eb.ref(key)]));
      }),
    )
    .execute();
};
