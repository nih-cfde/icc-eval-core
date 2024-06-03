import { execSync } from "child_process";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { users } from "./schema";

execSync("npx drizzle-kit push");

export const sqlite = new Database("./database/local.db");

export const db = drizzle(sqlite, { schema });

export const test = async () => {
  await db.insert(users).values({ username: "Foo" });
  console.log(await db.selectDistinct().from(users));
};
