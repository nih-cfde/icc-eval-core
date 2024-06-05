import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const fundingNumbers = sqliteTable("fundingNumbers", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  activityCode: text("activityCode").notNull(),
});

export type Funding = {
  id: string;
  type: "RFA" | "NOT" | "OTA" | "";
  activityCode: string;
};
