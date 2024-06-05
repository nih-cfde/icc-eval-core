import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Database } from "./schema";

const dbLocation = "./database/local.db";

const dialect = new SqliteDialect({ database: new SQLite(dbLocation) });

export const db = new Kysely<Database>({ dialect });
