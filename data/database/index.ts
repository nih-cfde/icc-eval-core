import { rmSync } from "fs";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import type { Database } from "./schema";

const { DB_PATH = "" } = process.env;

/**
 * while still prototyping and size of data still small, start db from scratch
 * every time instead of writing migrations
 */
rmSync(DB_PATH, { force: true });

const database = new SQLite(DB_PATH);
const dialect = new SqliteDialect({ database });

export const db = new Kysely<Database>({ dialect });
