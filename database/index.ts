import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Database } from "./schema";
import { unlinkSync } from "fs";

const dbLocation = "./database/local.db";

unlinkSync(dbLocation);

const dialect = new SqliteDialect({ database: new SQLite(dbLocation) });

export const db = new Kysely<Database>({ dialect });
