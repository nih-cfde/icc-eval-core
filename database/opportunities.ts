import { CreateTableBuilder } from "kysely";
import { db } from ".";

export type Opportunity = {
  id: string;
  type: "RFA" | "NOT" | "OTA" | "";
  activityCode: string;
};

await (
  db.schema
    .createTable("opportunity")
    .ifNotExists()
    .addColumn("id", "text", (c) => c.primaryKey())
    .addColumn("type", "text", (c) => c.notNull())
    .addColumn("activityCode", "text", (c) =>
      c.notNull()
    ) satisfies CreateTableBuilder<"opportunity", keyof Opportunity>
).execute();

export const addOpportunities = async (opportunities: Opportunity[]) => {
  await db
    .insertInto("opportunity")
    .values(opportunities)
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => {
        const keys = Object.keys(opportunities[0]!) as (keyof Opportunity)[];
        return Object.fromEntries(keys.map((key) => [key, eb.ref(key)]));
      })
    )
    .execute();
};
