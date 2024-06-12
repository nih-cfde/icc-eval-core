import { existsSync, unlinkSync } from "fs";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import type { Database } from "./schema";

const dbLocation = "./database/local.db";

/**
 * while still prototyping and size of data still small, start db from scratch
 * every time instead of writing migrations
 */
if (existsSync(dbLocation)) unlinkSync(dbLocation);

const dialect = new SqliteDialect({ database: new SQLite(dbLocation) });

export const db = new Kysely<Database>({ dialect });
