import { db } from ".";
import type { CreateTableBuilder } from "kysely";

/** funding opportunity */
export type Opportunity = {
  id: string;
  prefix: "RFA" | "NOT" | "OTA" | "";
  activity_code: string;
};

/** opportunity table */
const schema: CreateTableBuilder<"opportunity", keyof Opportunity> = db.schema
  .createTable("opportunity")
  .ifNotExists()
  .addColumn("id", "text", (c) => c.primaryKey())
  .addColumn("prefix", "text", (c) => c.notNull())
  .addColumn("activity_code", "text", (c) => c.notNull());

await schema.execute();

/** add opportunities to db */
export const addOpportunities = async (opportunities: Opportunity[]) => {
  await db
    .insertInto("opportunity")
    .values(opportunities)
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => {
        const keys = Object.keys(opportunities[0]!) as (keyof Opportunity)[];
        return Object.fromEntries(keys.map((key) => [key, eb.ref(key)]));
      }),
    )
    .execute();
};
