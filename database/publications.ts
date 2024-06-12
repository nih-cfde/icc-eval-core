import { db } from ".";
import type { CreateTableBuilder } from "kysely";

/** publication */
export type Publication = {
  id: number;
  core_project: string;
  application: number;
};

/** publication table */
const schema: CreateTableBuilder<"publication", keyof Publication> = db.schema
  .createTable("publication")
  .ifNotExists()
  .addColumn("id", "integer", (c) => c.primaryKey())
  .addColumn("core_project", "text", (c) => c.notNull())
  .addColumn("application", "integer", (c) => c.notNull());

await schema.execute();

/** add publications to db */
export const addPublications = async (publications: Publication[]) => {
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
