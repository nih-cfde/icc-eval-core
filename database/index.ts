import { execSync } from "child_process";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { log } from "../util/log";
import * as schema from "./schema";
import { existsSync, unlinkSync } from "fs";
const dbLocation = "./database/local.db";

log("info", "Making fresh db");
if (existsSync(dbLocation)) unlinkSync(dbLocation);
/** push schema to db */
execSync("npx drizzle-kit push");

/** raw db */
export const sqlite = new Database(dbLocation);

/** db client */
export const db = drizzle(sqlite, { schema });
