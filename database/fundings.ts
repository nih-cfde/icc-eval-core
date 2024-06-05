import { CreateTableBuilder } from "kysely";
import { db } from ".";

export type Funding = {
  id: string;
  type: "RFA" | "NOT" | "OTA" | "";
  activityCode: string;
};

await (
  db.schema
    .createTable("funding")
    .ifNotExists()
    .addColumn("id", "text", (c) => c.primaryKey())
    .addColumn("type", "text", (c) => c.notNull())
    .addColumn("activityCode", "text", (c) =>
      c.notNull()
    ) satisfies CreateTableBuilder<"funding", keyof Funding>
).execute();

export const addFundings = async (fundings: Funding[]) => {
  await db
    .insertInto("funding")
    .values(fundings)
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => {
        const keys = Object.keys(fundings[0]!) as (keyof Funding)[];
        return Object.fromEntries(keys.map((key) => [key, eb.ref(key)]));
      })
    )
    .execute();
};
