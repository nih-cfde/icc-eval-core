import { unlinkSync } from "fs";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import type { Database } from "./schema";

const dbLocation = "./database/local.db";

unlinkSync(dbLocation);

const dialect = new SqliteDialect({ database: new SQLite(dbLocation) });

export const db = new Kysely<Database>({ dialect });
